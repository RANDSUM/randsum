import './ReferenceDisclosure.css'

interface ReferenceDisclosureProps {
  readonly children: React.ReactNode
}

export function ReferenceDisclosure({ children }: ReferenceDisclosureProps): React.ReactElement {
  return (
    <details className="pg-reference-disclosure">
      <summary className="pg-reference-disclosure__summary">Quick Reference</summary>
      <div className="pg-reference-disclosure__content">{children}</div>
    </details>
  )
}
