// components/ProgressBar.tsx
export default function ProgressBar({
  processed,
  total,
  label
}: {
  processed: number
  total: number
  label?: string
}) {
  const pct =
    total > 0 ? Math.min(100, Math.round((processed / total) * 100)) : 0

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between text-xs text-text-secondary">
        <span>
          {label ?? 'Syncing...'} {processed} / {total} ({pct}%)
        </span>
      </div>
      <div className="w-full h-2 rounded-full bg-surface-raised overflow-hidden">
        <div
          className="h-full bg-accent rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
