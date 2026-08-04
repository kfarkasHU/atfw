class Blueprint {
  active: boolean;
  property: () => string;

  constructor(active: boolean) {
    this.active = active;
    this.property = () => `ready`;
  }
}

export function readClassBlueprint(blueprint: Blueprint): string {
  if (blueprint.active) {
    return blueprint.property();
  }

  return `inactive`;
}
