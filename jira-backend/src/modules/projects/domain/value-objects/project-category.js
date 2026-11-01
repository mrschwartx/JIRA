import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const PROJECT_CATEGORIES = Object.freeze([
  'software',
  'marketing',
  'business',
]);
export const DEFAULT_PROJECT_CATEGORY = 'software';

export const ProjectCategory = defineTextValueObject({
  label: 'Project category',
  minLength: 1,
  maxLength: 20,
  defaultValue: DEFAULT_PROJECT_CATEGORY,
  allowedValues: PROJECT_CATEGORIES,
});
