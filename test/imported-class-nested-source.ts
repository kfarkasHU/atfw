import { ImportedSession } from './imported-nested-models';

export function canStart(session: ImportedSession): boolean {
  if (session.active && session.details.ready) {
    return true;
  }

  return false;
}
