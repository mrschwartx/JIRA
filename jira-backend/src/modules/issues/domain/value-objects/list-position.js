import { ValidationError } from '../../../../shared/domain/errors.js';

export const parseListPosition = (raw) => {
  if (typeof raw !== 'number' || !Number.isFinite(raw)) {
    throw new ValidationError('List position must be a finite number');
  }
  return raw;
};
