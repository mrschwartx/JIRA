import { defineTextValueObject } from '../../../shared/domain/text-value-object.js';

export const CommentBody = defineTextValueObject({
  label: 'Comment body',
  minLength: 1,
  maxLength: 5000,
});
