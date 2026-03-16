import { toast } from 'sonner'

export class APIError extends Error {
  constructor(
    message: string,
    public status: number,
    public data?: any
  ) {
    super(message)
    this.name = 'APIError'
  }
}

const getToken = () => localStorage.getItem('token')

const apiCall = async (
  endpoint: string,
  options: RequestInit = {}
): Promise<any> => {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }

  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint}`

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    })

    const data = await response.json()

    if (!response.ok) {
      const message = data.message || data.error || 'An error occurred'
      throw new APIError(message, response.status, data)
    }

    return data
  } catch (error) {
    if (error instanceof APIError) {
      throw error
    }

    if (error instanceof Error) {
      throw new APIError(error.message, 0, null)
    }

    throw new APIError('An unknown error occurred', 0, null)
  }
}

export const api = {
  get: async (endpoint: string) => {
    return apiCall(endpoint, { method: 'GET' })
  },

  post: async (endpoint: string, data: any) => {
    return apiCall(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  },

  put: async (endpoint: string, data: any) => {
    return apiCall(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  },

  patch: async (endpoint: string, data: any) => {
    return apiCall(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  },

  delete: async (endpoint: string) => {
    return apiCall(endpoint, { method: 'DELETE' })
  },
}

export const handleApiError = (error: unknown, defaultMessage = 'An error occurred') => {
  if (error instanceof APIError) {
    toast.error(error.message)
    if (error.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return error.message
  }

  if (error instanceof Error) {
    toast.error(error.message)
    return error.message
  }

  toast.error(defaultMessage)
  return defaultMessage
}
