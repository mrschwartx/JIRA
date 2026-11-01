import { ValidationError } from '../../../../shared/domain/errors.js';

const KEY_PATTERN = /^[A-Z][A-Z0-9]{1,9}$/;

export class ProjectKey {
  #value;

  constructor(value) {
    this.#value = value;
    Object.freeze(this);
  }

  static create(raw) {
    if (typeof raw !== 'string') {
      throw new ValidationError('Project key is required');
    }
    const value = raw.trim().toUpperCase();
    if (!KEY_PATTERN.test(value)) {
      throw new ValidationError(
        'Project key must be 2 to 10 characters, start with a letter and contain only letters and digits'
      );
    }
    return new ProjectKey(value);
  }

  static restore(value) {
    return new ProjectKey(value);
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof ProjectKey && other.value === this.#value;
  }
}
