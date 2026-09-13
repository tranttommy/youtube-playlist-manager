// components/Checkbox.tsx
export default function Checkbox({
  checked,
  onChange,
  label,
  children
}: {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  children?: React.ReactNode
}) {
  return (
    <label className="shrink-0 inline-flex items-center gap-3 cursor-pointer">
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        aria-label={label}
        className="peer sr-only"
      />
      <span
        className={`flex items-center justify-center w-5 h-5 rounded border transition-colors duration-200 peer-focus-visible:ring-2 peer-focus-visible:ring-accent/60 ${
          checked
            ? 'bg-accent border-accent text-white'
            : 'bg-surface border-border hover:border-text-muted'
        }`}
      >
        {checked && <CheckIcon />}
      </span>
      {children}
    </label>
  )
}

const CheckIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="3"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <title>Checked</title>
    <path d="M20 6 9 17l-5-5" />
  </svg>
)
