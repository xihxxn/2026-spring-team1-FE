import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Link, useNavigate } from 'react-router-dom'
import { ApiError } from '@/shared/api/client'
import { Button } from '@/shared/ui/Button'
import { Field } from '@/shared/ui/Field'
import { Input } from '@/shared/ui/Input'
import { Logo } from '@/shared/ui/Logo'
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
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-ink px-6 py-12">
      {/* subtle background glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-[500px] w-[500px] rounded-full bg-paper/5 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-40 -left-40 h-[400px] w-[400px] rounded-full bg-paper/5 blur-3xl" />

      {/* card */}
      <div className="relative w-full max-w-[440px] rounded-3xl bg-paper px-10 py-12 shadow-2xl">
        <div className="mb-8">
          <Logo dark />
        </div>

        <div className="mb-8 space-y-1">
          <h1 className="font-body text-2xl font-bold tracking-tight text-ink">로그인</h1>
          <p className="font-body text-sm text-ink-soft">계속하려면 계정에 로그인하세요.</p>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          <Field label="아이디" error={errors.loginId?.message} coord="field:01">
            <Input autoComplete="username" {...register('loginId')} />
          </Field>

          <Field label="비밀번호" error={errors.password?.message} coord="field:02">
            <Input type="password" autoComplete="current-password" {...register('password')} />
          </Field>

          {formError && (
            <p className="font-display text-[13px] text-danger" role="alert">
              {formError}
            </p>
          )}

          <Button type="submit" className="mt-2 w-full" disabled={login.isPending}>
            {login.isPending ? '확인하는 중…' : '로그인'}
          </Button>

          <p className="text-center font-body text-sm text-ink-soft">
            계정이 없으신가요?{' '}
            <Link to="/signup" className="text-ink underline underline-offset-4">
              회원가입
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
