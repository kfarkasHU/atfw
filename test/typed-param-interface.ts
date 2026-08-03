interface User {
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
}

export function createUserInterface(user: User): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
