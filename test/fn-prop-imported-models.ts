export interface ImportedFnPropInterface {
  active: boolean;
  property: () => string;
}

export type ImportedFnPropType = {
  active: boolean;
  property: () => string;
};

export class ImportedFnPropClass {
  active: boolean;
  property: () => string;

  constructor(active: boolean) {
    this.active = active;
    this.property = () => `ready`;
  }
}
