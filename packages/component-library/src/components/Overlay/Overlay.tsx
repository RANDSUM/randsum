import { useEffect } from 'react'
import type React from 'react'
import './Overlay.css'

export function Overlay({
  visible,
  dismissing,
  dismissible = true,
  onDismiss,
  children
}: {
  readonly visible: boolean
  readonly dismissing: boolean
  readonly dismissible?: boolean
  readonly onDismiss: () => void
  readonly children: React.ReactNode
}): React.JSX.Element | null {
  useEffect(() => {
    if (!visible) return
    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') onDismiss()
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [visible, onDismiss])

  if (!visible) return null

  return (
    <div
      className={[
        'rp-overlay',
        dismissible && !dismissing ? 'rp-overlay--dismissible' : '',
        dismissing ? 'rp-overlay--dismissing' : ''
      ]
        .filter(Boolean)
        .join(' ')}
      onClick={dismissible && !dismissing ? onDismiss : undefined}
    >
      <div
        className="rp-overlay-card"
        onClick={e => {
          e.stopPropagation()
        }}
      >
        <div className="rp-overlay-card-inner">{children}</div>
      </div>
    </div>
  )
}
