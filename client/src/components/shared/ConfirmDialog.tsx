import { Modal } from './Modal'
import { AlertCircle } from 'lucide-react'

interface ConfirmDialogProps {
  isOpen: boolean
  onClose: () => void
  title: string
  message: string
  confirmLabel?: string
  cancelLabel?: string
  isDangerous?: boolean
  onConfirm: () => void
  isLoading?: boolean
}

export function ConfirmDialog({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  isDangerous = false,
  onConfirm,
  isLoading = false,
}: ConfirmDialogProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="sm"
      actions={
        <>
          <button onClick={onClose} className="btn-secondary">
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={isDangerous ? 'px-4 py-2 bg-danger text-foreground font-medium rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed' : 'btn-primary'}
          >
            {isLoading ? 'Loading...' : confirmLabel}
          </button>
        </>
      }
    >
      <div className="flex gap-4">
        {isDangerous && (
          <div className="flex-shrink-0">
            <AlertCircle className="text-danger" size={24} />
          </div>
        )}
        <div>
          <p className="text-foreground">{message}</p>
        </div>
      </div>
    </Modal>
  )
}
