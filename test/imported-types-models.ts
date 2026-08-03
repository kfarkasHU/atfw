export interface ImportedUserInterface {
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

export type ImportedUserType = {
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
};

export class ImportedUserClass {
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

  constructor(active: boolean) {
    this.active = active;
    this.name = `name_value`;
    this.profile = {
      address: {
        city: `city_value`,
        zip: 1,
      },
      flags: {
        verified: false,
      },
    };
    this.roles = [];
  }
}
