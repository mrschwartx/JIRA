import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const ISSUE_STATUSES = Object.freeze([
  'backlog',
  'selected',
  'inprogress',
  'done',
]);
export const DEFAULT_ISSUE_STATUS = 'backlog';

export const IssueStatus = defineTextValueObject({
  label: 'Issue status',
  minLength: 1,
  maxLength: 20,
  defaultValue: DEFAULT_ISSUE_STATUS,
  allowedValues: ISSUE_STATUSES,
});
