import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { useLogin } from '../hooks'

const schema = z.object({
  loginId: z.string().min(1, '아이디를 입력해주세요.'),
  password: z.string().min(1, '비밀번호를 입력해주세요.'),
})

type FormValues = z.infer<typeof schema>

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
    <div className="grid min-h-screen lg:grid-cols-2">
      {/* 좌측: 서비스의 실제 파이프라인을 그대로 인용한 히어로 */}
      <div className="relative hidden overflow-hidden bg-ink px-16 py-14 text-paper lg:flex lg:flex-col">
        <span className="coord-label text-draft">x:0 y:0</span>

        <div className="mt-24 max-w-md space-y-6">
          <p className="font-display text-[11px] tracking-[0.2em] text-draft uppercase">
            Team1 · 회의록에서 화면까지
          </p>
          <h1 className="font-body text-[42px] leading-[1.2] font-bold tracking-tight">
            초안을
            <br />
            확정으로
          </h1>
          <p className="max-w-xs font-body text-[15px] leading-relaxed text-paper/70">
            회의록 한 장이 기획서, 기능 명세, 화면 기획을 거쳐 와이어프레임으로
            굳어질 때까지. 팀 리더의 확정 한 번마다 다음 단계가 열립니다.
          </p>
        </div>

        <ol className="mt-auto flex gap-6 border-t border-paper/10 pt-6 font-display text-[11px] tracking-wide text-draft uppercase">
          {['기획서', '기능 명세', '화면 기획', '와이어프레임'].map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="text-paper/40">{String(i).padStart(2, '0')}</span>
              {s}
            </li>
          ))}
        </ol>

        <span className="absolute right-16 bottom-14 coord-label text-draft">
          x:560 y:640
        </span>
      </div>

      {/* 우측: 폼 자체가 하나의 blueprint */}
      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={onSubmit} className="w-full max-w-sm space-y-7">
          <div className="space-y-1.5">
            <h2 className="font-body text-[28px] font-bold tracking-tight text-ink">
              로그인
            </h2>
            <p className="font-body text-sm text-ink-soft">
              프로젝트로 돌아가서 이어서 진행하세요.
            </p>
          </div>

          <div className="space-y-4">
            <Field label="아이디" error={errors.loginId?.message} coord="field:01">
              <Input autoComplete="username" {...register('loginId')} />
            </Field>

            <Field label="비밀번호" error={errors.password?.message} coord="field:02">
              <Input
                type="password"
                autoComplete="current-password"
                {...register('password')}
              />
            </Field>
          </div>

          {formError && (
            <p className="font-display text-[13px] text-danger" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={login.isPending}>
            {login.isPending ? '확인하는 중…' : '로그인'}
          </Button>

          <p className="text-center font-body text-sm text-ink-soft">
            아직 계정이 없나요?{' '}
            <Link to="/signup" className="text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
