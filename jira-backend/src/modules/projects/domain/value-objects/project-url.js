import { ValidationError } from '../../../../shared/domain/errors.js';

const MAX_LENGTH = 2048;
const ALLOWED_PROTOCOLS = ['http:', 'https:'];

export class ProjectUrl {
  #value;

  constructor(value) {
    this.#value = value;
    Object.freeze(this);
  }

  static create(raw) {
    if (raw === undefined || raw === null || raw === '') {
      return new ProjectUrl(null);
    }
    if (typeof raw !== 'string') {
      throw new ValidationError('Project URL must be a string');
    }
    const value = raw.trim();
    let parsed;
    try {
      parsed = new URL(value);
    } catch {
      throw new ValidationError('Project URL is invalid');
    }
    if (
      value.length > MAX_LENGTH ||
      !ALLOWED_PROTOCOLS.includes(parsed.protocol)
    ) {
      throw new ValidationError(
        'Project URL must be a valid http or https URL'
      );
    }
    return new ProjectUrl(value);
  }

  static restore(value) {
    return new ProjectUrl(value);
  }

  get value() {
    return this.#value;
  }

  equals(other) {
    return other instanceof ProjectUrl && other.value === this.#value;
  }
}
