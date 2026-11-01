import type { ProjectCategory } from './types'

export const PROJECT_CATEGORIES: readonly ProjectCategory[] = ['software', 'marketing', 'business']

export const PROJECT_CATEGORY_LABELS: Record<ProjectCategory, string> = {
  software: 'Software',
  marketing: 'Marketing',
  business: 'Business',
}
