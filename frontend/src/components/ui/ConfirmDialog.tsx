import { Modal } from './Modal'
import { Button } from './Button'

interface ConfirmDialogProps {
    open: boolean
    onClose: () => void
    onConfirm: () => void
    title: string
    message: string
    confirmText?: string
    cancelText?: string
    danger?: boolean
}

export function ConfirmDialog({
    open,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = '确定',
    cancelText = '取消',
    danger = false
}: ConfirmDialogProps) {
    return (
        <Modal open={open} onClose={onClose} title={title} className="max-w-sm">
            <div className="space-y-4">
                <p className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap">
                    {message}
                </p>
                <div className="flex items-center justify-end gap-3 pt-2">
                    <Button variant="ghost" onClick={onClose} size="sm">
                        {cancelText}
                    </Button>
                    <Button
                        variant={danger ? 'danger' : 'primary'}
                        onClick={() => { onConfirm(); onClose() }}
                        size="sm"
                    >
                        {confirmText}
                    </Button>
                </div>
            </div>
        </Modal>
    )
}
