import { MODIFIER_DOCS } from '@randsum/roller/docs'
import { QuickReferenceGrid } from '@randsum/dice-ui'
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
      <QuickReferenceGrid
        notation=""
        selectedEntry={selectedEntry}
        onSelect={onSelect}
        onAdd={(_fragment: string) => undefined}
      />
      {doc !== undefined && selectedEntry !== null && (
        <ReferenceDetail modifierKey={selectedEntry} doc={doc} />
      )}
    </aside>
  )
}
