import { ImportedFnPropInterface } from './fn-prop-imported-models';

export function readImportedInterfaceBlueprint(blueprint: ImportedFnPropInterface): string {
  if (blueprint.active) {
    return blueprint.property();
  }

  return `inactive`;
}
