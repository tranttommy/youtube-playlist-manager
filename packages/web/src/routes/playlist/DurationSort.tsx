export default function DurationSort({
  value,
  onChange
}: {
  value: string
  onChange: (sort: string) => void
}) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor="duration-sort"
        className="text-xs font-medium text-text-secondary"
      >
        Sort by Duration
      </label>
      <select
        id="duration-sort"
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full bg-surface-raised border border-border rounded-lg px-3 py-2.5 text-sm text-text-primary focus:outline-none focus:border-text-muted transition-colors duration-200 cursor-pointer"
      >
        <option value="">Default</option>
        <option value="ascending">Ascending</option>
        <option value="descending">Descending</option>
      </select>
    </div>
  )
}
