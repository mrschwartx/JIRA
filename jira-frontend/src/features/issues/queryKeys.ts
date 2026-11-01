export const issueKeys = {
  all: ['issues'] as const,
  list: (projectId: string) => [...issueKeys.all, 'list', projectId] as const,
  search: (projectId: string, term: string) => [...issueKeys.all, 'search', projectId, term] as const,
}
