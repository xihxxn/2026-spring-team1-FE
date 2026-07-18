export function Logo({ dark = false }: { dark?: boolean }) {
  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
          dark ? 'bg-ink' : 'bg-paper'
        }`}
      >
        <svg
          className={`h-4 w-4 ${dark ? 'text-paper' : 'text-ink'}`}
          fill="currentColor"
          viewBox="0 0 24 24"
        >
          <path d="M12 1 14.7 9.3 23 12 14.7 14.7 12 23 9.3 14.7 1 12 9.3 9.3z" />
        </svg>
      </div>
      <span
        className={`font-body text-base font-bold tracking-tight ${
          dark ? 'text-ink' : 'text-paper'
        }`}
      >
        PlanFlow
      </span>
    </div>
  )
}
