import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const ProjectName = defineTextValueObject({
  label: 'Project name',
  minLength: 1,
  maxLength: 100,
});
