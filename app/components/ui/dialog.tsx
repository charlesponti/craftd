import { clsx } from 'clsx'
import { X } from 'lucide-react'
import React, { forwardRef, useEffect, useRef, useState } from 'react'

interface DialogContextType {
  open: boolean
  onOpenChange: (open: boolean) => void
}

interface DialogProps {
  children: React.ReactNode
  open?: boolean
  onOpenChange?: (open: boolean) => void
}

const Dialog = ({ children, open, onOpenChange }: DialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false)
  const isControlled = open !== undefined
  const actualOpen = isControlled ? open : internalOpen

  const handleOpenChange = (newOpen: boolean) => {
    if (isControlled) {
      onOpenChange?.(newOpen)
    } else {
      setInternalOpen(newOpen)
    }
  }

  return (
    <div data-dialog-context={JSON.stringify({ open: actualOpen, onOpenChange: handleOpenChange })}>
      {children}
    </div>
  )
}

const DialogTrigger = forwardRef<
  HTMLElement,
  React.HTMLAttributes<HTMLElement> & { children: React.ReactElement }
>(({ children, onClick, ...props }, ref) => {
  const handleClick = (e: React.MouseEvent) => {
    const context = JSON.parse(
      e.currentTarget.closest('[data-dialog-context]')?.getAttribute('data-dialog-context') || '{}'
    )
    context.onOpenChange?.(true)
    onClick?.(e)
  }

  // Clone the child element and add our click handler
  return React.cloneElement(children, {
    ...props,
    onClick: handleClick,
    ref,
  })
})
DialogTrigger.displayName = 'DialogTrigger'

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

const DialogContent = ({ children, className }: DialogContentProps) => {
  const dialogRef = useRef<HTMLDialogElement>(null)
  const [context, setContext] = useState<DialogContextType>({ open: false, onOpenChange: () => {} })

  useEffect(() => {
    const dialogElement = dialogRef.current?.closest('[data-dialog-context]')
    if (dialogElement) {
      const contextData = JSON.parse(dialogElement.getAttribute('data-dialog-context') || '{}')
      setContext(contextData)
    }
  }, [])

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return

    if (context.open) {
      dialog.showModal()
    } else {
      dialog.close()
    }
  }, [context.open])

  const handleClose = () => {
    context.onOpenChange(false)
  }

  const handleBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === e.currentTarget) {
      handleClose()
    }
  }

  const handleBackdropKeyDown = (e: React.KeyboardEvent<HTMLDialogElement>) => {
    if (e.key === 'Escape') {
      handleClose()
    }
  }

  return (
    <dialog
      ref={dialogRef}
      className={clsx(
        'relative rounded-lg bg-white p-6 shadow-xl backdrop:bg-black backdrop:bg-opacity-50',
        'w-full max-w-lg',
        className
      )}
      onClick={handleBackdropClick}
      onKeyDown={handleBackdropKeyDown}
      onClose={handleClose}
    >
      <div className="relative">
        <button
          type="button"
          onClick={handleClose}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              handleClose()
            }
          }}
          className="absolute right-0 top-0 rounded-sm opacity-70 ring-offset-white transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          <X className="h-4 w-4" />
          <span className="sr-only">Close</span>
        </button>
        {children}
      </div>
    </dialog>
  )
}

const DialogHeader = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => (
  <div className={clsx('flex flex-col space-y-1.5 text-center sm:text-left', className)}>
    {children}
  </div>
)

const DialogTitle = ({
  children,
  className,
}: { children: React.ReactNode; className?: string }) => (
  <h2 className={clsx('text-lg font-semibold leading-none tracking-tight', className)}>
    {children}
  </h2>
)

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger }
