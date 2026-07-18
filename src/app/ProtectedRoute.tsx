import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/auth/hooks'

export function ProtectedRoute() {
  const location = useLocation()
  const { data: me, isPending, isError } = useMe()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#111111]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-white/20 border-t-white/70" />
          <p className="font-display text-[11px] tracking-[0.15em] text-white/25 uppercase">
            불러오는 중
          </p>
        </div>
      </div>
    )
  }

  if (isError || me === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
