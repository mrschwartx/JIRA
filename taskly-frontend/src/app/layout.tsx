import type { Metadata } from 'next'
import { AppProviders } from './AppProviders'
import { NavBar } from './layouts/NavBar'

export const metadata: Metadata = {
  title: 'Taskly',
  description: 'Taskly helps you manage your day and to-do list.',
}

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    <html lang="en">
      <body>
        <AppProviders>
          <NavBar />
          <main>{children}</main>
        </AppProviders>
      </body>
    </html>
  )
}
