import { ImportedUserInterface } from './imported-types-models';

export function createImportedInterfaceUser(user: ImportedUserInterface): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
