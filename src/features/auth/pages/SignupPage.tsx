import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Logo } from '@/shared/ui/Logo'
import { useSignup } from '../hooks'

const schema = z.object({
  name: z.string().min(1, '이름을 입력해주세요.'),
  loginId: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(6, '비밀번호는 6자 이상이어야 합니다.'),
})

type FormValues = z.infer<typeof schema>

export function SignupPage() {
  const navigate = useNavigate()
  const signup = useSignup()
  const [formError, setFormError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormValues>({ resolver: zodResolver(schema) })

  const onSubmit = handleSubmit((values) => {
    setFormError(null)
    signup.mutate(values, {
      onSuccess: () => navigate('/login', { replace: true }),
      onError: (error) => {
        setFormError(error instanceof ApiError ? error.message : '회원가입에 실패했습니다.')
      },
    })
  })

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#111111] px-6 py-12">
      <div className="pointer-events-none absolute -top-24 -right-24 h-[400px] w-[400px] rounded-full bg-white/[0.06] blur-3xl" />
      <div className="pointer-events-none absolute -bottom-24 -left-24 h-[350px] w-[350px] rounded-full bg-white/[0.04] blur-3xl" />

      <div className="relative w-full max-w-[400px] overflow-hidden rounded-3xl border border-white/[0.15] bg-white/10 px-10 py-12 shadow-[0_24px_64px_rgba(0,0,0,0.5)] backdrop-blur-2xl">
        <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/40 to-transparent" />

        <div className="mb-8">
          <Logo />
        </div>

        <div className="mb-7 space-y-1">
          <h1 className="font-body text-2xl font-bold tracking-tight text-white">회원가입</h1>
          <p className="font-body text-sm text-white/40">새 계정을 만들어 시작하세요.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-4">
          <GlassField label="이름" error={errors.name?.message}>
            <input
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="홍길동"
              autoComplete="name"
              {...register('name')}
            />
          </GlassField>

          <GlassField label="아이디" error={errors.loginId?.message}>
            <input
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="아이디를 입력하세요"
              autoComplete="username"
              {...register('loginId')}
            />
          </GlassField>

          <GlassField label="비밀번호" error={errors.password?.message}>
            <input
              type="password"
              className="h-11 w-full bg-transparent font-body text-sm text-white outline-none placeholder:text-white/20"
              placeholder="6자 이상"
              autoComplete="new-password"
              {...register('password')}
            />
          </GlassField>

          {formError && (
            <p className="font-display text-[12px] text-white/60" role="alert">
              {formError}
            </p>
          )}

          <button
            type="submit"
            disabled={signup.isPending}
            className="mt-2 h-11 w-full rounded-xl bg-white font-display text-[13px] font-medium tracking-wide text-black uppercase transition-opacity hover:opacity-90 disabled:opacity-40"
          >
            {signup.isPending ? '만드는 중…' : '계정 만들기'}
          </button>

          <p className="text-center font-body text-sm text-white/35">
            이미 계정이 있으신가요?{' '}
            <Link
              to="/login"
              className="text-white/70 underline underline-offset-4 transition-colors hover:text-white"
            >
              로그인
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}

function GlassField({
  label,
  error,
  children,
}: {
  label: string
  error?: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-1.5">
      <label className="font-display text-[10px] tracking-[0.15em] text-white/35 uppercase">
        {label}
      </label>
      <div className="rounded-xl border border-white/[0.12] bg-white/[0.05] px-4 transition-all focus-within:border-white/50 focus-within:bg-white/[0.08] focus-within:ring-1 focus-within:ring-white/20">
        {children}
      </div>
      {error && <p className="font-display text-[11px] text-white/60">{error}</p>}
    </div>
  )
}
