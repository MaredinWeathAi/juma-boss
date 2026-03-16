import { useEffect } from 'react'
import { X } from 'lucide-react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  actions?: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Modal({ isOpen, onClose, title, children, actions, size = 'md' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }

    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-fadeIn">
      <div className={`card w-full mx-4 animate-slideIn ${sizeClasses[size]}`}>
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-lg font-semibold">{title}</h2>
          <button
            onClick={onClose}
            className="p-1 hover:bg-card-hover rounded-lg transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">{children}</div>

        {actions && (
          <div className="flex items-center justify-end gap-3 p-6 border-t border-border">
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
