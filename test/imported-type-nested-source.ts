import { ImportedFlags } from './imported-nested-models';

export function isHighLevel(flags: ImportedFlags): boolean {
  if (flags.active && flags.details.level > 3) {
    return true;
  }

  return false;
}
