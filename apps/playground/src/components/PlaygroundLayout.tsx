import type React from 'react'
import './PlaygroundLayout.css'

interface PlaygroundLayoutProps {
  readonly children: React.ReactNode
}

export function PlaygroundLayout({ children }: PlaygroundLayoutProps): React.ReactElement {
  return <div className="playground-layout">{children}</div>
}
