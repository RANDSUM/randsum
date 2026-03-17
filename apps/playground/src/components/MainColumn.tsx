import type React from 'react'
import './MainColumn.css'

interface MainColumnProps {
  readonly children: React.ReactNode
}

export function MainColumn({ children }: MainColumnProps): React.ReactElement {
  return <div className="main-column">{children}</div>
}
