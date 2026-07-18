import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { useLogin } from '../hooks'
import { Logo } from '@/shared/ui/Logo'

const schema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

const PIPELINE = ['기획서', '기능 명세', '화면 기획', '와이어프레임']

export function LoginPage() {
  const navigate = useNavigate()
  const login = useLogin()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    login.mutate(values, {
      onSuccess: () => navigate('/projects', { replace: true }),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : '로그인에 실패했습니다.')
      },
    })
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111111] px-6 py-12">

      {/* 배경 블롭 */}
      <div className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-white/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[350px] w-[350px] rounded-full bg-white/[0.04] blur-3xl" />

      {/* 중앙 컨테이너 — 소개 + 카드 나란히 */}
      <div className="relative flex w-full max-w-5xl items-center gap-20">

        {/* 왼쪽 — 서비스 소개 */}
        <div className="hidden lg:flex flex-1 flex-col gap-10">
          <Logo />

          <div className="space-y-7">
            <p className="font-display text-[12px] tracking-[0.2em] text-white/30 uppercase">
              회의록에서 화면까지
            </p>
            <h2 className="font-body text-[52px] font-bold leading-[1.15] tracking-tight text-white">
              회의 한 번으로<br />
              기획서부터<br />
              와이어프레임까지
            </h2>
            <p className="font-body text-[16px] leading-relaxed text-white/50">
              AI가 회의록을 분석해 기획서, 기능 명세,<br />
              화면 기획을 순서대로 생성합니다.
            </p>

            <div className="flex flex-col gap-3 pt-2">
              {PIPELINE.map((step, i) => (
                <div key={step} className="flex items-center gap-3">
                  <span className="font-display text-[11px] text-white/25">{String(i + 1).padStart(2, '0')}</span>
                  <span className="font-display text-[13px] tracking-wide text-white/55 uppercase">{step}</span>
                </div>
              ))}
            </div>
          </div>

          <p className="font-display text-[11px] text-white/20">© 2026 PlanFlow</p>
        </div>

        {/* 오른쪽 — glass 카드 */}
        <div className="relative w-full overflow-hidden rounded-3xl border border-white/[0.15] bg-white/10 px-10 py-10 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl lg:w-[360px] lg:shrink-0">

          {/* 카드 상단 하이라이트 */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

          {/* 모바일 전용 로고 */}
          <div className="mb-8 lg:hidden">
            <Logo />
          </div>

          <div className="mb-7 space-y-1">
            <h1 className="font-body text-2xl font-bold tracking-tight text-white">로그인</h1>
            <p className="font-body text-sm text-white/40">계속하려면 계정에 로그인하세요.</p>
          </div>

          <form onSubmit={onSubmit} className="space-y-4">

            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.15em] text-white/35 uppercase">아이디</label>
              <div className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:bg-white/[0.1] focus-within:ring-1 focus-within:ring-white/20">
                <input
                  className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
                  placeholder="아이디를 입력하세요"
                  autoComplete="username"
                  {...register('loginId')}
                />
              </div>
              {errors.loginId && <p className="font-display text-[11px] text-white/60">{errors.loginId.message}</p>}
            </div>

            <div className="space-y-1.5">
              <label className="font-display text-[10px] tracking-[0.15em] text-white/35 uppercase">비밀번호</label>
              <div className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:bg-white/[0.1] focus-within:ring-1 focus-within:ring-white/20">
                <input
                  type="password"
                  className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
                  placeholder="비밀번호를 입력하세요"
                  autoComplete="current-password"
                  {...register('password')}
                />
              </div>
              {errors.password && <p className="font-display text-[11px] text-white/60">{errors.password.message}</p>}
            </div>

            {formError && (
              <p className="font-display text-[12px] text-white/60" role="alert">{formError}</p>
            )}

            <button
              type="submit"
              disabled={login.isPending}
              className="mt-2 h-11 w-full rounded-xl bg-white font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
            >
              {login.isPending ? '확인하는 중…' : '로그인'}
            </button>

            <p className="text-center font-body text-sm text-white/35">
              계정이 없으신가요?{' '}
              <Link to="/signup" className="text-white/70 underline underline-offset-4 transition-colors hover:text-white">
                회원가입
              </Link>
            </p>

          </form>
        </div>

      </div>
    </div>
  )
}
