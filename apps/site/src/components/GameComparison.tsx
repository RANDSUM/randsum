const games = [
  {
    id: 'fifth',
    name: 'D&D 5th Edition',
    packageName: '@randsum/games/fifth',
    color: 'var(--game-fifth)',
    dice: '1d20 or 2d20',
    input: 'modifier + rollingWith',
    inputExample: 'roll({ modifier: 5, rollingWith: "Advantage" })',
    outcomes: ['Numeric total'],
    description:
      'Classic d20 system with advantage and disadvantage support for ability checks, saving throws, and attack rolls.'
  },
  {
    id: 'blades',
    name: 'Blades in the Dark',
    packageName: '@randsum/games/blades',
    color: 'var(--game-blades)',
    dice: 'Nd6 pool (0-10)',
    input: 'count (number)',
    inputExample: 'roll(3)',
    outcomes: ['critical', 'success', 'partial', 'failure'],
    description:
      'Dice pool system where you read the highest die. Zero dice means rolling two and keeping the lowest.'
  },
  {
    id: 'daggerheart',
    name: 'Daggerheart',
    packageName: '@randsum/games/daggerheart',
    color: 'var(--game-daggerheart)',
    dice: '2d12 hope/fear + d6',
    input: 'modifier + rollingWith + amplify',
    inputExample: 'roll({ modifier: 3, rollingWith: "Advantage" })',
    outcomes: ['Hope/Fear type', 'total', 'details'],
    description:
      'Dual d12 hope and fear dice with optional amplification and advantage/disadvantage.'
  },
  {
    id: 'pbta',
    name: 'Powered by the Apocalypse',
    packageName: '@randsum/games/pbta',
    color: 'var(--game-pbta)',
    dice: '2d6',
    input: 'stat + forward + ongoing + advantage',
    inputExample: 'roll({ stat: 2, forward: 1 })',
    outcomes: ['strong_hit', 'weak_hit', 'miss'],
    description:
      'Universal 2d6+stat engine for Dungeon World, Monster of the Week, Apocalypse World, Masks, and more.'
  },
  {
    id: 'root-rpg',
    name: 'Root RPG',
    packageName: '@randsum/games/root-rpg',
    color: 'var(--game-root-rpg)',
    dice: '2d6',
    input: 'bonus (number, -20 to +20)',
    inputExample: 'roll(2)',
    outcomes: ['Strong Hit', 'Weak Hit', 'Miss'],
    description: 'Woodland adventure RPG using 2d6+bonus with three-tier outcome resolution.'
  },
  {
    id: 'salvageunion',
    name: 'Salvage Union',
    packageName: '@randsum/games/salvageunion',
    color: 'var(--game-salvageunion)',
    dice: '1d20',
    input: 'tableName (string)',
    inputExample: 'roll("Core Mechanic")',
    outcomes: ['label', 'description', 'hit type'],
    description:
      'D20 table-based resolution system for mech salvage operations with multiple result tables.'
  }
] as const

function OutcomeBadge({
  outcome,
  color
}: {
  readonly outcome: string
  readonly color: string
}): React.JSX.Element {
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '0.125rem 0.5rem',
        borderRadius: '9999px',
        fontSize: '0.75rem',
        fontFamily: 'var(--sl-font-mono)',
        fontWeight: 500,
        background: `color-mix(in srgb, ${color} 15%, transparent)`,
        color,
        border: `1px solid color-mix(in srgb, ${color} 30%, transparent)`,
        lineHeight: 1.5
      }}
    >
      {outcome}
    </span>
  )
}

function GameCard({ game }: { readonly game: (typeof games)[number] }): React.JSX.Element {
  return (
    <div className="gc-card" style={{ borderTopColor: game.color }}>
      <div className="gc-card-header">
        <h3 className="gc-card-title" style={{ color: game.color }}>
          {game.name}
        </h3>
        <code className="gc-card-package">{game.packageName}</code>
      </div>

      <p className="gc-card-desc">{game.description}</p>

      <div className="gc-card-details">
        <div className="gc-card-field">
          <span className="gc-card-label">Dice</span>
          <span className="gc-card-value">{game.dice}</span>
        </div>

        <div className="gc-card-field">
          <span className="gc-card-label">Input</span>
          <span className="gc-card-value">{game.input}</span>
        </div>

        <div className="gc-card-field">
          <span className="gc-card-label">Example</span>
          <code className="gc-card-code">{game.inputExample}</code>
        </div>

        <div className="gc-card-field">
          <span className="gc-card-label">Outcomes</span>
          <div className="gc-card-outcomes">
            {game.outcomes.map(outcome => (
              <OutcomeBadge key={outcome} outcome={outcome} color={game.color} />
            ))}
          </div>
        </div>
      </div>

      <a className="gc-card-link" href={`/games/${game.id}/`}>
        View documentation
      </a>
    </div>
  )
}

function TableRow({ game }: { readonly game: (typeof games)[number] }): React.JSX.Element {
  return (
    <tr>
      <td>
        <a href={`/games/${game.id}/`} className="gc-table-name" style={{ color: game.color }}>
          {game.name}
        </a>
      </td>
      <td>
        <code className="gc-table-mono">{game.dice}</code>
      </td>
      <td className="gc-table-input">{game.input}</td>
      <td>
        <div className="gc-table-outcomes">
          {game.outcomes.map(outcome => (
            <OutcomeBadge key={outcome} outcome={outcome} color={game.color} />
          ))}
        </div>
      </td>
      <td>
        <code className="gc-table-mono">{game.packageName}</code>
      </td>
    </tr>
  )
}

export function GameComparison(): React.JSX.Element {
  return (
    <>
      <style>{styles}</style>
      <div className="gc-container">
        {/* Desktop table view */}
        <div className="gc-table-wrap">
          <table className="gc-table">
            <thead>
              <tr>
                <th>Game</th>
                <th>Dice</th>
                <th>Input</th>
                <th>Outcomes</th>
                <th>Package</th>
              </tr>
            </thead>
            <tbody>
              {games.map(game => (
                <TableRow key={game.id} game={game} />
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile card view */}
        <div className="gc-cards">
          {games.map(game => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </div>
    </>
  )
}

const styles = `
  .gc-container {
    font-family: var(--sl-font);
    color: var(--sl-color-white);
  }

  /* Desktop table */
  .gc-table-wrap {
    display: none;
    overflow-x: auto;
    border: 1px solid var(--sl-color-gray-4);
    border-radius: var(--radius, 5px);
    background: var(--sl-color-gray-6);
  }

  @media (min-width: 900px) {
    .gc-table-wrap {
      display: block;
    }
    .gc-cards {
      display: none !important;
    }
  }

  .gc-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.875rem;
  }

  .gc-table thead {
    background: var(--sl-color-gray-5);
  }

  .gc-table th {
    padding: 0.75rem 1rem;
    text-align: left;
    font-weight: 600;
    font-size: 0.8125rem;
    color: var(--sl-color-gray-2);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    border-bottom: 1px solid var(--sl-color-gray-4);
  }

  .gc-table td {
    padding: 0.75rem 1rem;
    border-bottom: 1px solid var(--sl-color-gray-5);
    vertical-align: top;
  }

  .gc-table tbody tr:last-child td {
    border-bottom: none;
  }

  .gc-table tbody tr:hover {
    background: color-mix(in srgb, var(--sl-color-gray-5) 50%, transparent);
  }

  .gc-table-name {
    font-weight: 600;
    text-decoration: none;
    font-size: 0.875rem;
  }

  .gc-table-name:hover {
    text-decoration: underline;
  }

  .gc-table-mono {
    font-family: var(--sl-font-mono);
    font-size: 0.8125rem;
    color: var(--sl-color-gray-1);
  }

  .gc-table-input {
    font-size: 0.8125rem;
    color: var(--sl-color-gray-1);
  }

  .gc-table-outcomes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  /* Mobile cards */
  .gc-cards {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  @media (min-width: 900px) {
    .gc-cards {
      display: none;
    }
  }

  .gc-card {
    border: 1px solid var(--sl-color-gray-4);
    border-top: 3px solid;
    border-radius: var(--radius, 5px);
    padding: 1.25rem;
    background: var(--sl-color-gray-6);
  }

  .gc-card-header {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
    margin-bottom: 0.75rem;
  }

  .gc-card-title {
    margin: 0;
    font-size: 1.125rem;
    font-weight: 700;
    font-family: var(--sl-font-heading);
    letter-spacing: -0.02em;
  }

  .gc-card-package {
    font-family: var(--sl-font-mono);
    font-size: 0.75rem;
    color: var(--sl-color-gray-3);
  }

  .gc-card-desc {
    font-size: 0.8125rem;
    color: var(--sl-color-gray-2);
    line-height: 1.5;
    margin: 0 0 1rem;
  }

  .gc-card-details {
    display: flex;
    flex-direction: column;
    gap: 0.625rem;
    margin-bottom: 1rem;
  }

  .gc-card-field {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .gc-card-label {
    font-size: 0.6875rem;
    font-weight: 600;
    color: var(--sl-color-gray-3);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }

  .gc-card-value {
    font-size: 0.875rem;
    color: var(--sl-color-gray-1);
  }

  .gc-card-code {
    font-family: var(--sl-font-mono);
    font-size: 0.75rem;
    color: var(--sl-color-accent-high);
    background: var(--sl-color-gray-5);
    padding: 0.25rem 0.5rem;
    border-radius: var(--radius, 5px);
    display: inline-block;
    word-break: break-all;
  }

  .gc-card-outcomes {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem;
  }

  .gc-card-link {
    display: inline-block;
    font-size: 0.8125rem;
    font-weight: 600;
    color: var(--sl-color-accent);
    text-decoration: none;
  }

  .gc-card-link:hover {
    text-decoration: underline;
  }
`
