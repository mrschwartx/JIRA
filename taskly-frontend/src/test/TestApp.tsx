import type { ReactNode } from 'react'
import PrivateLayout from '@/app/(private)/layout'
import CreateTaskRoute from '@/app/(private)/create-task/page'
import ProfileRoute from '@/app/(private)/profile/page'
import TaskDetailRoute from '@/app/(private)/tasks/[taskId]/page'
import TasksRoute from '@/app/(private)/tasks/page'
import UpdateTaskRoute from '@/app/(private)/update-task/[taskId]/page'
import { NavBar } from '@/app/layouts/NavBar'
import HomeRoute from '@/app/page'
import SignInRoute from '@/app/signin/page'
import SignUpRoute from '@/app/signup/page'
import { MemoryRoutes } from './MemoryRoutes'

const privately = (page: ReactNode) => <PrivateLayout>{page}</PrivateLayout>

const routes = {
  '/': <HomeRoute />,
  '/signup': <SignUpRoute />,
  '/signin': <SignInRoute />,
  '/profile': privately(<ProfileRoute />),
  '/create-task': privately(<CreateTaskRoute />),
  '/update-task/[taskId]': privately(<UpdateTaskRoute />),
  '/tasks': privately(<TasksRoute />),
  '/tasks/[taskId]': privately(<TaskDetailRoute />),
}

export function TestApp() {
  return (
    <>
      <NavBar />
      <main>
        <MemoryRoutes routes={routes} />
      </main>
    </>
  )
}
