import { Loader2 } from 'lucide-react'

interface LoadingSpinnerProps {
  size?: number
  text?: string
}

export function LoadingSpinner({ size = 32, text = 'Loading...' }: LoadingSpinnerProps) {
  return (
    <div className="flex items-center justify-center flex-col gap-3 py-12">
      <Loader2 size={size} className="animate-spin text-primary" />
      {text && <p className="text-muted-foreground">{text}</p>}
    </div>
  )
}
