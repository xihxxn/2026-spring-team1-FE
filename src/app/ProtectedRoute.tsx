import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useMe } from '@/features/auth/hooks'

// 로그인 여부(GET /auth/me)를 확인해 미로그인 시 로그인 페이지로 보낸다.
export function ProtectedRoute() {
  const location = useLocation()
  const { data: me, isPending, isError } = useMe()

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-gray-500">
        불러오는 중…
      </div>
    )
  }

  if (isError || me === null) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  return <Outlet />
}
