import { GoalTile } from './GoalTile'

/**
 * Responsive grid of goal tiles. Tiles render in array order so the Tab order
 * matches the visual order. When `errorMessage` is set, an inline alert region
 * is rendered above the grid for assistive tech and sighted users alike.
 *
 * @param {{
 *   tiles: Array<object>,
 *   onSelect: (tile: object) => void,
 *   disabled?: boolean,
 *   errorMessage?: string | null,
 * }} props
 */
export function GoalTileGrid({ tiles = [], onSelect, disabled = false, errorMessage }) {
  return (
    <div className="flex flex-col gap-3">
      {errorMessage && (
        <p role="alert" className="text-sm font-medium text-red-600">
          {errorMessage}
        </p>
      )}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {tiles.map((tile) => (
          <GoalTile
            key={tile.id}
            tile={tile}
            onSelect={onSelect}
            disabled={disabled}
          />
        ))}
      </div>
    </div>
  )
}
