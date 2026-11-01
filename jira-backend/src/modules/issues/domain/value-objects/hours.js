import { ValidationError } from '../../../../shared/domain/errors.js';

export const MAX_HOURS = 10000;

export const parseOptionalHours = (raw, label) => {
  if (raw === undefined || raw === null) {
    return null;
  }
  if (!Number.isInteger(raw) || raw < 0 || raw > MAX_HOURS) {
    throw new ValidationError(
      `${label} must be a whole number between 0 and ${MAX_HOURS}`
    );
  }
  return raw;
};
