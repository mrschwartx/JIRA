export const projectKeys = {
  all: ['projects'] as const,
  list: () => [...projectKeys.all, 'list'] as const,
  detail: (projectId: string) => [...projectKeys.all, 'detail', projectId] as const,
  members: (projectId: string) => [...projectKeys.all, 'members', projectId] as const,
}
