import { ImportedFnPropClass } from './fn-prop-imported-models';

export function readImportedClassBlueprint(blueprint: ImportedFnPropClass): string {
  if (blueprint.active) {
    return blueprint.property();
  }

  return `inactive`;
}
