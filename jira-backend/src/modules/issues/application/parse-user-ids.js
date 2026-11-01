import { parseEntityId } from '../../../shared/domain/entity-id.js';
import { ValidationError } from '../../../shared/domain/errors.js';

export const parseUserIdList = (raw, label) => {
  if (!Array.isArray(raw)) {
    throw new ValidationError(`${label} must be an array`);
  }
  return raw.map((id) => parseEntityId(id, 'user'));
};
