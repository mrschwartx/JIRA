export const paths = {
  home: '/',
  signUp: '/signup',
  signIn: '/signin',
  profile: '/profile',
  projects: '/projects',
  board: (projectId: string) => `/projects/${projectId}/board`,
  issue: (projectId: string, issueId: string) => `/projects/${projectId}/board/issues/${issueId}`,
  settings: (projectId: string) => `/projects/${projectId}/settings`,
}
