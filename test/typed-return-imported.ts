import type { ImportedReturnUser } from './typed-return-imported-models';

export function createImportedUser(flag: boolean): ImportedReturnUser {
  if (flag) {
    return {
      active: true,
      profile: {
        city: `alpha`,
      },
    };
  }

  return {
    active: false,
    profile: {
      city: `beta`,
    },
  };
}
