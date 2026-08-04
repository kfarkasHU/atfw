import { ImportedAccount } from './imported-nested-models';

export function canLogin(account: ImportedAccount): boolean {
  if (account.active && account.profile.verified) {
    return true;
  }

  return false;
}
