class Profile {
  address: {
    city: string;
    zip: number;
  };

  flags: {
    verified: boolean;
  };

  constructor() {
    this.address = {
      city: `city_value`,
      zip: 1,
    };
    this.flags = {
      verified: false,
    };
  }
}

class User {
  active: boolean;
  name: string;
  profile: Profile;
  roles: string[];

  constructor(active: boolean) {
    this.active = active;
    this.name = `name_value`;
    this.profile = new Profile();
    this.roles = [];
  }
}

export function createUserClass(user: User): boolean {
  if (user.active) {
    return true;
  }

  throw new Error(`inactive`);
}
