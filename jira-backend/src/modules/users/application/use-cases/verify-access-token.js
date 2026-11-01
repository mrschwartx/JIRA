import { AuthenticationError } from '../../../../shared/domain/errors.js';

export class VerifyAccessToken {
  #tokenService;

  constructor({ tokenService }) {
    this.#tokenService = tokenService;
  }

  async execute({ token } = {}) {
    if (!token) {
      throw new AuthenticationError('Unauthorized: Token not provided');
    }

    try {
      return this.#tokenService.verify(token);
    } catch {
      throw new AuthenticationError('Unauthorized: Invalid token');
    }
  }
}
