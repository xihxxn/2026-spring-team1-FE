import { createBrowserRouter, Navigate } from 'react-router-dom'
import { ProtectedRoute } from './ProtectedRoute'
import { AppLayout } from '@/shared/layouts/AppLayout'
import { LoginPage } from '@/features/auth/pages/LoginPage'
import { SignupPage } from '@/features/auth/pages/SignupPage'
import { JoinPage } from '@/features/auth/pages/JoinPage'
import { ProjectListPage } from '@/features/project/pages/ProjectListPage'
import { ProjectDetailPage } from '@/features/project/pages/ProjectDetailPage'
import { StagePage } from '@/features/stage/pages/StagePage'
import { WireframePage } from '@/features/wireframe/pages/WireframePage'

export const router = createBrowserRouter([
  { path: '/login', element: <LoginPage /> },
  { path: '/signup', element: <SignupPage /> },

  {
    element: <ProtectedRoute />,
    children: [
      // /join?token=xxx — 초대 링크 처리 (로그인 필요)
      { path: '/join', element: <JoinPage /> },
      {
        element: <AppLayout />,
        children: [
          { path: '/', element: <Navigate to="/projects" replace /> },
          { path: '/projects', element: <ProjectListPage /> },
          { path: '/projects/:projectId', element: <ProjectDetailPage /> },
          { path: '/projects/:projectId/stages/:stageType', element: <StagePage /> },
          { path: '/projects/:projectId/wireframes', element: <WireframePage /> },
        ],
      },
    ],
  },

  { path: '*', element: <Navigate to="/" replace /> },
])
