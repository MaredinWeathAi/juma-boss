import { create } from 'zustand'
import type { User } from '@/types'
import { api } from '@/lib/api'

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  isAuthenticated: boolean
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string, bakeryName: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  setUser: (user: User | null) => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,

  login: async (email: string, password: string) => {
    const response = await api.post('/auth/login', { email, password })
    const { token, user } = response

    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },

  register: async (name: string, email: string, password: string, bakeryName: string) => {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      bakeryName,
    })
    const { token, user } = response

    localStorage.setItem('token', token)
    set({ user, token, isAuthenticated: true })
  },

  logout: () => {
    localStorage.removeItem('token')
    set({ user: null, token: null, isAuthenticated: false })
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token')
    if (!token) {
      set({ isLoading: false, isAuthenticated: false })
      return
    }

    try {
      const response = await api.get('/auth/me')
      set({ user: response.user, token, isAuthenticated: true, isLoading: false })
    } catch {
      localStorage.removeItem('token')
      set({ user: null, token: null, isAuthenticated: false, isLoading: false })
    }
  },

  setUser: (user: User | null) => {
    set({ user })
  },
}))
