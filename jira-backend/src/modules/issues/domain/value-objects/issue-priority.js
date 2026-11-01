import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const ISSUE_PRIORITIES = Object.freeze([
  'lowest',
  'low',
  'medium',
  'high',
  'highest',
]);
export const DEFAULT_ISSUE_PRIORITY = 'medium';

export const IssuePriority = defineTextValueObject({
  label: 'Issue priority',
  minLength: 1,
  maxLength: 10,
  defaultValue: DEFAULT_ISSUE_PRIORITY,
  allowedValues: ISSUE_PRIORITIES,
});
