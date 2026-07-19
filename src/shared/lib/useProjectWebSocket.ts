import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useMe } from '@/features/auth/hooks'
import { stageKeys } from '@/features/stage/hooks'
import { wireframeKeys } from '@/features/wireframe/hooks'
import { webSocketUrl } from '@/shared/config/environment'

// ── 서버와 주고받는 메시지 형식 ────────────────────────────────
type RealtimeEventType =
  | 'USER_JOINED'
  | 'USER_LEFT'
  | 'DOCUMENT_UPDATE'
  | 'AI_GENERATION_COMPLETED'
  | 'STAGE_CONFIRMED'
  | 'WIREFRAME_UPDATED'
  | 'REGENERATION_REQUESTED'

interface RealtimeEventMessage {
  type: RealtimeEventType
  projectId: number
  userId: number
  payload: Record<string, unknown>
  timestamp: string
}

interface UseProjectWebSocketResult {
  /** 현재 프로젝트에 접속 중인 사용자 수 (본인 포함) */
  onlineCount: number
  /** 다른 멤버에게 문서 편집 내용을 브로드캐스트 */
  sendDocumentUpdate: (payload: Record<string, unknown>) => void
}

export function useProjectWebSocket(projectId: number): UseProjectWebSocketResult {
  const queryClient = useQueryClient()
  const { data: me } = useMe()
  const wsRef = useRef<WebSocket | null>(null)
  const currentUserIdRef = useRef<number | null>(me?.userId ?? null)
  const mountedRef = useRef(true)
  const [onlineCount, setOnlineCount] = useState(0)

  useEffect(() => {
    currentUserIdRef.current = me?.userId ?? null
  }, [me?.userId])

  useEffect(() => {
    if (!projectId) return
    mountedRef.current = true

    let reconnectTimer: ReturnType<typeof setTimeout> | null = null

    const connect = () => {
      const ws = new WebSocket(webSocketUrl(`/ws/projects/${projectId}`))
      wsRef.current = ws

      ws.onopen = () => {
        if (reconnectTimer) {
          clearTimeout(reconnectTimer)
          reconnectTimer = null
        }
        // 재연결 시 이전 카운트 초기화 — USER_JOINED 이벤트로 다시 집계
        setOnlineCount(0)
      }

      ws.onmessage = (event: MessageEvent) => {
        try {
          const msg: RealtimeEventMessage = JSON.parse(event.data as string)
          handleEvent(msg)
        } catch {
          // 파싱 실패 시 무시
        }
      }

      ws.onclose = () => {
        wsRef.current = null
        if (mountedRef.current) {
          // 3초 후 재연결
          reconnectTimer = setTimeout(connect, 3000)
        }
      }

      ws.onerror = () => {
        ws.close()
      }
    }

    const handleEvent = (msg: RealtimeEventMessage) => {
      switch (msg.type) {
        case 'USER_JOINED': {
          const total = msg.payload?.onlineCount
          if (typeof total === 'number') setOnlineCount(total)
          else setOnlineCount((n) => n + 1)
          break
        }

        case 'USER_LEFT': {
          const total = msg.payload?.onlineCount
          if (typeof total === 'number') setOnlineCount(total)
          else setOnlineCount((n) => Math.max(0, n - 1))
          break
        }

        case 'AI_GENERATION_COMPLETED':
        case 'STAGE_CONFIRMED':
        case 'DOCUMENT_UPDATE': {
          // 내 REST 응답은 각 mutation이 이미 캐시에 반영하므로 stale 표시만 한다.
          // 다른 사용자의 이벤트는 현재 보고 있는 문서를 즉시 다시 조회해야 공동 편집
          // 변경이 화면에 나타난다. 로그인 정보가 아직 없으면 안전하게 원격 이벤트로 본다.
          const isOwnEvent =
            currentUserIdRef.current !== null && msg.userId === currentUserIdRef.current
          queryClient.invalidateQueries({
            queryKey: [...stageKeys.all, projectId],
            refetchType: isOwnEvent ? 'none' : 'active',
          })
          break
        }

        case 'WIREFRAME_UPDATED':
          queryClient.invalidateQueries({ queryKey: wireframeKeys.screens(projectId) })
          break

        case 'REGENERATION_REQUESTED':
          queryClient.invalidateQueries({
            queryKey: wireframeKeys.regenerationRequests(projectId),
          })
          break
      }
    }

    connect()

    return () => {
      mountedRef.current = false
      if (reconnectTimer) clearTimeout(reconnectTimer)
      wsRef.current?.close()
      wsRef.current = null
    }
  }, [projectId, queryClient])

  const sendDocumentUpdate = (payload: Record<string, unknown>) => {
    const ws = wsRef.current
    if (!ws || ws.readyState !== WebSocket.OPEN) return
    ws.send(
      JSON.stringify({
        type: 'DOCUMENT_UPDATE',
        payload,
      }),
    )
  }

  return { onlineCount, sendDocumentUpdate }
}
