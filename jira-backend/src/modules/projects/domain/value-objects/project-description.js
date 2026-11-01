import { defineTextValueObject } from '../../../../shared/domain/text-value-object.js';

export const ProjectDescription = defineTextValueObject({
  label: 'Project description',
  minLength: 0,
  maxLength: 10000,
  defaultValue: '',
});
