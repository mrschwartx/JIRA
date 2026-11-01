import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const IssueTitle = defineTextValueObject({
  label: 'Issue title',
  minLength: 1,
  maxLength: 200,
});
