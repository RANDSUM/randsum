import { openNotationInStackBlitz } from '../../helpers/stackblitz'

/** The footer action every site roller carries: the notation as runnable code. */
export function StackBlitzAction({ notation }: { readonly notation: string }): React.JSX.Element {
  return (
    <button
      type="button"
      className="site-roller-action"
      disabled={notation.length === 0}
      onClick={() => {
        openNotationInStackBlitz(notation)
      }}
    >
      Edit in StackBlitz ↗
    </button>
  )
}
