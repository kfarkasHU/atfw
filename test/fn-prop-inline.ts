export function readInlineBlueprint(blueprint: { active: boolean; property: () => string }): string {
  if (blueprint.active) {
    return blueprint.property();
  }

  return `inactive`;
}
