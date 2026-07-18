import { cn } from '@/shared/lib/cn'

const STAGES = [
  { key: 'PLAN', label: '기획서' },
  { key: 'FEATURE_SPEC', label: '기능 명세' },
  { key: 'SCREEN_SPEC', label: '화면 기획' },
  { key: 'WIREFRAME', label: '와이어프레임' },
] as const

export type StageKey = (typeof STAGES)[number]['key']

interface StageRulerProps {
  current: StageKey
  className?: string
}

// PLAN → FEATURE_SPEC → SCREEN_SPEC → WIREFRAME 은 이 서비스가 실제로 강제하는
// 순서이므로(이전 단계 확정 없이 다음 단계 생성 불가), 눈금자로 순서를 그대로 보여준다.
// 지나온 눈금은 잉크로 굳고, 아직 오지 않은 눈금은 연필(draft) 색으로 남는다.
export function StageRuler({ current, className }: StageRulerProps) {
  const currentIndex = STAGES.findIndex((s) => s.key === current)

  return (
    <ol className={cn('flex items-stretch', className)}>
      {STAGES.map((stage, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <li key={stage.key} className="flex flex-1 flex-col gap-2">
            <div
              className={cn(
                'h-1',
                done || active ? 'bg-ink' : 'bg-line',
                active && 'bg-confirm',
              )}
            />
            <div className="flex items-baseline justify-between">
              <span
                className={cn(
                  'font-display text-[11px] tracking-wide uppercase',
                  active ? 'text-confirm' : done ? 'text-ink' : 'text-draft',
                )}
              >
                {stage.label}
              </span>
              <span className="coord-label">{String(index).padStart(2, '0')}</span>
            </div>
          </li>
        )
      })}
    </ol>
  )
}
