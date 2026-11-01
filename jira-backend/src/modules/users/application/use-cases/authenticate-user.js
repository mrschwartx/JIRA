import {
  AuthenticationError,
  ValidationError,
} from '../../../../shared/domain/errors.js';
import { toUserDto } from '../user-dto.js';

export class AuthenticateUser {
  #userRepository;
  #passwordHasher;
  #tokenService;

  constructor({ userRepository, passwordHasher, tokenService }) {
    this.#userRepository = userRepository;
    this.#passwordHasher = passwordHasher;
    this.#tokenService = tokenService;
  }

  async execute({ email, password } = {}) {
    if (typeof email !== 'string' || typeof password !== 'string') {
      throw new ValidationError('Email and password are required');
    }

    const user = await this.#userRepository.findByEmail(email.trim());
    const passwordMatches = user
      ? await this.#passwordHasher.compare(password, user.passwordHash)
      : false;
    if (!user || !passwordMatches) {
      throw new AuthenticationError('Invalid email or password');
    }

    return {
      user: toUserDto(user),
      token: this.#tokenService.issue({ userId: user.id }),
    };
  }
}
