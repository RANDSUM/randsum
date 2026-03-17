import { MODIFIER_DOCS } from '@randsum/display-utils'
import { QuickReferenceGrid } from './QuickReferenceGrid'
import { ReferenceDetail } from './ReferenceDetail'
import './ReferenceSidebar.css'

interface ReferenceSidebarProps {
  readonly selectedEntry: string | null
  readonly onSelect: (key: string) => void
}

export function ReferenceSidebar({
  selectedEntry,
  onSelect
}: ReferenceSidebarProps): React.ReactElement {
  const doc = selectedEntry !== null ? MODIFIER_DOCS[selectedEntry] : undefined

  return (
    <aside className="pg-reference-sidebar">
      <QuickReferenceGrid selectedEntry={selectedEntry} onSelect={onSelect} />
      {doc !== undefined && selectedEntry !== null && (
        <ReferenceDetail modifierKey={selectedEntry} doc={doc} />
      )}
    </aside>
  )
}
