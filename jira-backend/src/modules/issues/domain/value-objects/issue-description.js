import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const IssueDescription = defineTextValueObject({
  label: 'Issue description',
  minLength: 0,
  maxLength: 20000,
  defaultValue: '',
});
