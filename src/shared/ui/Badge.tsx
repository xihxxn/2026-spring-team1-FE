import { cn } from '@/shared/lib/cn'

type BadgeTone = 'draft' | 'confirm' | 'danger' | 'neutral'

interface BadgeProps {
  tone?: BadgeTone
  children: React.ReactNode
  className?: string
}

const toneClasses: Record<BadgeTone, string> = {
  draft: 'text-draft border-draft',
  confirm: 'text-white border-white/40',
  danger: 'text-danger border-danger bg-danger-bg',
  neutral: 'text-white/70 border-white/25',
}

// DRAFT/CONFIRMED 같은 백엔드 상태값을 그대로 보여주는 상태 배지.
// 확정(confirm)만 배경이 채워져, 화면을 훑을 때 "무엇이 굳었는지"가 바로 보이게 한다.
export function Badge({ tone = 'neutral', children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-md border px-2.5 py-0.5 font-display text-xs tracking-wider uppercase',
        toneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  )
}
