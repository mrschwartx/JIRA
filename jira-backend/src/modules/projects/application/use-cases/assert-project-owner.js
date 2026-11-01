import { ForbiddenError } from '../../../../shared/domain/errors.js';
import { MEMBER_ROLES } from '../../domain/member-role.js';

export const assertProjectOwner = (role, message) => {
  if (role !== MEMBER_ROLES.OWNER) {
    throw new ForbiddenError(message);
  }
};
