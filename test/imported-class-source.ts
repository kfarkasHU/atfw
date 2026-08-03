import { ImportedUserClass } from './imported-types-models';

export function createImportedClassUser(user: ImportedUserClass): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
