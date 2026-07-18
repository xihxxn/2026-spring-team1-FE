import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Logo } from '@/shared/ui/Logo'
import { GlassCard } from '@/shared/ui/GlassCard'
import { useJoinProject } from '@/features/project/hooks'

export function JoinPage() {
  const [params] = useSearchParams()
  const urlToken = params.get('token') ?? ''
  const navigate = useNavigate()
  const join = useJoinProject()
  const [error, setError] = useState<string | null>(null)
  const [codeInput, setCodeInput] = useState('')
  const [joining, setJoining] = useState(false)

  // URL에 token이 있으면 자동으로 참여
  useEffect(() => {
    if (!urlToken) return
    join.mutate(
      { inviteToken: urlToken },
      {
        onSuccess: (res) => navigate(`/projects/${res.projectId}`, { replace: true }),
        onError: (e) => setError(e instanceof ApiError ? e.message : '초대 코드가 유효하지 않습니다.'),
      },
    )
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleJoinByCode = () => {
    const code = codeInput.trim()
    if (!code) return
    setError(null)
    setJoining(true)
    join.mutate(
      { inviteToken: code },
      {
        onSuccess: (res) => navigate(`/projects/${res.projectId}`, { replace: true }),
        onError: (e) => {
          setError(e instanceof ApiError ? e.message : '초대 코드가 유효하지 않습니다.')
          setJoining(false)
        },
      },
    )
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#0c0c0c] px-6">
      <div className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-white/[0.06] blur-3xl" />

      <GlassCard className="w-full max-w-sm px-10 py-12 text-center">
        <div className="mb-8 flex justify-center">
          <Logo />
        </div>

        {/* URL 토큰으로 자동 참여 중 */}
        {urlToken && join.isPending && (
          <>
            <div className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
            <p className="font-body text-base font-bold text-white">프로젝트 참여 중…</p>
            <p className="mt-2 font-body text-sm text-white/40">잠시만 기다려주세요.</p>
          </>
        )}

        {/* URL 토큰 에러 */}
        {urlToken && error && (
          <>
            <p className="font-body text-base font-bold text-white">참여 실패</p>
            <p className="mt-2 font-body text-sm text-white/50">{error}</p>
            <Link
              to="/projects"
              className="mt-6 inline-block font-display text-[12px] tracking-wide text-white/50 uppercase underline underline-offset-4 hover:text-white"
            >
              프로젝트 목록으로
            </Link>
          </>
        )}

        {/* URL 토큰 없음 → 코드 직접 입력 */}
        {!urlToken && (
          <>
            <p className="font-body text-lg font-bold text-white">프로젝트 참여</p>
            <p className="mt-2 mb-8 font-body text-sm text-white/40">
              받은 초대 코드를 입력하여 프로젝트에 참여하세요.
            </p>

            <div className="space-y-3">
              <div className="rounded-2xl border border-white/[0.14] bg-white/[0.05] px-4 focus-within:border-white/40 focus-within:ring-1 focus-within:ring-white/20 transition-all">
                <input
                  value={codeInput}
                  onChange={(e) => setCodeInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleJoinByCode()}
                  placeholder=""
                  disabled={joining}
                  className="h-12 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/25 disabled:opacity-40"
                />
              </div>

              {error && <p className="font-display text-[12px] text-white/50 text-left">{error}</p>}

              <button
                onClick={handleJoinByCode}
                disabled={!codeInput.trim() || joining}
                className="h-11 w-full rounded-2xl bg-white font-display text-[12px] font-semibold tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-35"
              >
                {joining ? '참여 중…' : '참여하기'}
              </button>
            </div>

            <Link
              to="/projects"
              className="mt-6 inline-block font-display text-[11px] tracking-wide text-white/30 uppercase hover:text-white/60 transition-colors"
            >
              프로젝트 목록으로
            </Link>
          </>
        )}
      </GlassCard>
    </div>
  )
}
