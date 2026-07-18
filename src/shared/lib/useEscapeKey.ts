import { useEffect, useRef } from 'react'

/** 열려 있는 오버레이를 Escape 키로 닫는다. 최신 콜백을 ref로 보관해 재등록을 피한다. */
export function useEscapeKey(onEscape: () => void) {
  const onEscapeRef = useRef(onEscape)

  useEffect(() => {
    onEscapeRef.current = onEscape
  }, [onEscape])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return
      event.preventDefault()
      onEscapeRef.current()
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])
}
