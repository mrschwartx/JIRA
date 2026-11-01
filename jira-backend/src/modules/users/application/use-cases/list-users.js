import { ValidationError } from '../../../../shared/domain/errors.js';
import { toUserDto } from '../user-dto.js';

const MIN_QUERY_LENGTH = 2;
const MAX_QUERY_LENGTH = 100;
export const USER_SEARCH_LIMIT = 20;

export class ListUsers {
  #userRepository;

  constructor({ userRepository }) {
    this.#userRepository = userRepository;
  }

  async execute({ q } = {}) {
    if (typeof q !== 'string') {
      throw new ValidationError('Search query is required');
    }
    const query = q.trim();
    if (query.length < MIN_QUERY_LENGTH || query.length > MAX_QUERY_LENGTH) {
      throw new ValidationError(
        `Search query must be between ${MIN_QUERY_LENGTH} and ${MAX_QUERY_LENGTH} characters`
      );
    }

    const users = await this.#userRepository.search({
      query,
      limit: USER_SEARCH_LIMIT,
    });
    return users.map(toUserDto);
  }
}
