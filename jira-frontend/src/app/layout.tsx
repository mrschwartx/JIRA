import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { AppProviders } from './AppProviders'
import { NavBar } from './layouts/NavBar'

export const metadata: Metadata = {
  title: 'Jira',
  description: 'Plan, track and ship work with projects, issues and a drag and drop board.',
}

export default function RootLayout({ children }: { children: ReactNode }) {
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
