import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const ISSUE_TYPES = Object.freeze(['task', 'bug', 'story']);
export const DEFAULT_ISSUE_TYPE = 'task';

export const IssueType = defineTextValueObject({
  label: 'Issue type',
  minLength: 1,
  maxLength: 10,
  defaultValue: DEFAULT_ISSUE_TYPE,
  allowedValues: ISSUE_TYPES,
});
