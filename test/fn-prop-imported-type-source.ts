import { ImportedFnPropType } from './fn-prop-imported-models';

export function readImportedTypeBlueprint(blueprint: ImportedFnPropType): string {
  if (blueprint.active) {
    return blueprint.property();
  }

  return `inactive`;
}
