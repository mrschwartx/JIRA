import { Box } from '@chakra-ui/react'
import { FiAlertCircle, FiBookmark, FiCheckSquare, FiChevronDown, FiChevronsDown, FiChevronsUp, FiChevronUp, FiMinus } from 'react-icons/fi'
import type { ComponentType } from 'react'
import { ISSUE_PRIORITY_LABELS, ISSUE_TYPE_LABELS } from '../constants'
import type { IssuePriority, IssueType } from '../types'

type IconSpec = {
  Icon: ComponentType<{ size?: number; 'aria-hidden'?: boolean }>
  color: string
}

const TYPE_ICONS: Record<IssueType, IconSpec> = {
  task: { Icon: FiCheckSquare, color: '#4fade6' },
  bug: { Icon: FiAlertCircle, color: '#e5493a' },
  story: { Icon: FiBookmark, color: '#65ba43' },
}

const PRIORITY_ICONS: Record<IssuePriority, IconSpec> = {
  highest: { Icon: FiChevronsUp, color: '#cd1317' },
  high: { Icon: FiChevronUp, color: '#e9494a' },
  medium: { Icon: FiMinus, color: '#e97f33' },
  low: { Icon: FiChevronDown, color: '#2d8738' },
  lowest: { Icon: FiChevronsDown, color: '#57a55a' },
}

export function IssueTypeIcon({ type, size = 16 }: { type: IssueType; size?: number }) {
  const { Icon, color } = TYPE_ICONS[type]
  return (
    <Box as="span" display="inline-flex" color={color} role="img" aria-label={ISSUE_TYPE_LABELS[type]} title={ISSUE_TYPE_LABELS[type]}>
      <Icon size={size} aria-hidden />
    </Box>
  )
}

export function PriorityIcon({ priority, size = 16 }: { priority: IssuePriority; size?: number }) {
  const { Icon, color } = PRIORITY_ICONS[priority]
  const label = `${ISSUE_PRIORITY_LABELS[priority]} priority`
  return (
    <Box as="span" display="inline-flex" color={color} role="img" aria-label={label} title={label}>
      <Icon size={size} aria-hidden />
    </Box>
  )
}
