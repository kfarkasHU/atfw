import { ImportedUserType } from './imported-types-models';

export function createImportedTypeUser(user: ImportedUserType): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
