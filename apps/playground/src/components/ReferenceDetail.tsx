import type { NotationDoc } from '@randsum/roller/docs'

interface ReferenceDetailProps {
  readonly modifierKey: string
  readonly doc: NotationDoc
}

const containerStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-body)',
  backgroundColor: 'var(--pg-color-surface)',
  border: '1px solid var(--pg-color-border)',
  borderRadius: 'var(--pg-radius-md)',
  padding: 'var(--pg-space-md)',
  marginTop: 'var(--pg-space-sm)',
  overflow: 'hidden'
}

const headingStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-mono)',
  fontSize: '0.9rem',
  color: 'var(--pg-color-accent-high)',
  margin: '0 0 var(--pg-space-sm) 0'
}

const descriptionStyle: React.CSSProperties = {
  fontSize: '0.85rem',
  color: 'var(--pg-color-text-muted)',
  lineHeight: '1.5',
  margin: '0 0 var(--pg-space-md) 0'
}

const sectionLabelStyle: React.CSSProperties = {
  fontSize: '0.7rem',
  fontFamily: 'var(--pg-font-mono)',
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--pg-color-text-dim)',
  marginBottom: 'var(--pg-space-xs)'
}

const tableStyle: React.CSSProperties = {
  width: '100%',
  borderCollapse: 'collapse',
  marginBottom: 'var(--pg-space-md)',
  fontSize: '0.8rem'
}

const tableHeaderStyle: React.CSSProperties = {
  textAlign: 'left',
  fontFamily: 'var(--pg-font-mono)',
  fontSize: '0.7rem',
  letterSpacing: '0.05em',
  textTransform: 'uppercase',
  color: 'var(--pg-color-text-dim)',
  paddingBottom: 'var(--pg-space-xs)',
  borderBottom: '1px solid var(--pg-color-border)'
}

const tableCellStyle: React.CSSProperties = {
  padding: 'var(--pg-space-xs) 0',
  verticalAlign: 'top',
  borderBottom: '1px solid var(--pg-color-border)'
}

const notationCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  fontFamily: 'var(--pg-font-mono)',
  color: 'var(--pg-color-accent-high)',
  paddingRight: 'var(--pg-space-sm)',
  whiteSpace: 'nowrap'
}

const noteCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  color: 'var(--pg-color-text-muted)'
}

const operatorCellStyle: React.CSSProperties = {
  ...tableCellStyle,
  fontFamily: 'var(--pg-font-mono)',
  color: 'var(--pg-color-text)',
  paddingRight: 'var(--pg-space-sm)',
  whiteSpace: 'nowrap'
}

const examplesListStyle: React.CSSProperties = {
  listStyle: 'none',
  padding: 0,
  margin: '0 0 var(--pg-space-md) 0',
  display: 'flex',
  flexDirection: 'column',
  gap: 'var(--pg-space-xs)'
}

const exampleItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'baseline',
  gap: 'var(--pg-space-sm)',
  fontSize: '0.8rem'
}

const exampleCodeStyle: React.CSSProperties = {
  fontFamily: 'var(--pg-font-mono)',
  backgroundColor: 'var(--pg-color-surface-alt)',
  color: 'var(--pg-color-accent-high)',
  padding: '0.1em var(--pg-space-xs)',
  borderRadius: 'var(--pg-radius-sm)',
  whiteSpace: 'nowrap',
  flexShrink: 0
}

const exampleDescStyle: React.CSSProperties = {
  color: 'var(--pg-color-text-muted)'
}

export function ReferenceDetail({
  modifierKey: _modifierKey,
  doc
}: ReferenceDetailProps): React.ReactElement {
  return (
    <div style={containerStyle}>
      <h3 style={headingStyle}>{doc.title}</h3>
      <p style={descriptionStyle}>{doc.description}</p>

      <div style={sectionLabelStyle}>Forms</div>
      <table style={tableStyle}>
        <thead>
          <tr>
            <th style={tableHeaderStyle}>Notation</th>
            <th style={tableHeaderStyle}>Note</th>
          </tr>
        </thead>
        <tbody>
          {doc.forms.map((form, i) => (
            <tr key={i}>
              <td style={notationCellStyle}>{form.notation}</td>
              <td style={noteCellStyle}>{form.note}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {doc.comparisons !== undefined && doc.comparisons.length > 0 && (
        <>
          <div style={sectionLabelStyle}>Operators</div>
          <table style={tableStyle}>
            <thead>
              <tr>
                <th style={tableHeaderStyle}>Operator</th>
                <th style={tableHeaderStyle}>Meaning</th>
              </tr>
            </thead>
            <tbody>
              {doc.comparisons.map((comparison, i) => (
                <tr key={i}>
                  <td style={operatorCellStyle}>{comparison.operator}</td>
                  <td style={noteCellStyle}>{comparison.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      <div style={sectionLabelStyle}>Examples</div>
      <ul style={examplesListStyle}>
        {doc.examples.map((example, i) => (
          <li key={i} style={exampleItemStyle}>
            <code style={exampleCodeStyle}>{example.notation}</code>
            <span style={exampleDescStyle}>{example.description}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
