export function createUserInline(user: {
  active: boolean;
  name: string;
  profile: {
    address: {
      city: string;
      zip: number;
    };
    flags: {
      verified: boolean;
    };
  };
  roles: string[];
}): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
