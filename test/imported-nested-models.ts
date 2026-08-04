export interface ImportedAccount {
  active: boolean;
  profile: {
    verified: boolean;
  };
  roles: string[];
}

export type ImportedFlags = {
  active: boolean;
  details: {
    level: number;
  };
};

export class ImportedSession {
  active: boolean;
  details: {
    ready: boolean;
  };

  constructor(active: boolean) {
    this.active = active;
    this.details = {
      ready: false,
    };
  }
}
