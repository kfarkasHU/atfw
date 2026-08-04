interface Blueprint {
  active: boolean;
  property: () => () => string;
}

export function readNestedArrowBlueprint(blueprint: Blueprint): string {
  if (blueprint.active) {
    return blueprint.property()();
  }

  return `inactive`;
}
