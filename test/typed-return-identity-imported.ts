import type { ImportedIdentityUser } from './typed-return-identity-imported-models';

export function echoImportedUser(user: ImportedIdentityUser): ImportedIdentityUser {
  return user;
}
