import { cloneElement, isValidElement, useId, type ReactElement } from 'react'
import { cn } from '@/shared/lib/cn'

interface FieldProps {
  label: string
  error?: string
  children: ReactElement<{ id?: string; 'aria-invalid'?: boolean }>
  className?: string
  /** 코너 좌표 라벨에 표시할 좌표. 폼 내 위치를 눈금 삼아 그린다. */
  coord?: string
}

// 라벨 + blueprint-frame(점선→실선 전환) + 좌표 라벨을 하나로 묶는 필드 래퍼.
// 이 서비스가 다루는 x/y 좌표 DSL을 폼 자체의 그래픽 모티프로 가져온 것.
export function Field({ label, error, children, className, coord }: FieldProps) {
  const id = useId()
  const input = isValidElement(children)
    ? cloneElement(children, { id, 'aria-invalid': Boolean(error) })
    : children

  return (
    <div className={cn('space-y-1.5', className)}>
      <div className="flex items-baseline justify-between">
        <label htmlFor={id} className="font-display text-[11px] tracking-wide text-ink-soft uppercase">
          {label}
        </label>
        {coord && <span className="coord-label">{coord}</span>}
      </div>
      <div className="blueprint-frame px-0.5">{input}</div>
      {error && <p className="font-display text-[11px] text-danger">{error}</p>}
    </div>
  )
}
