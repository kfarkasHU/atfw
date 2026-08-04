export type User = {
  active: boolean;
  profile: {
    city: string;
  };
};

export function createLocalUser(flag: boolean): User {
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
