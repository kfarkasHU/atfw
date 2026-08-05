import { readText } from './primitive-import-source';

export function hasPositiveCharCode(flag: boolean): boolean {
  if (!flag) {
    return false;
  }

  return readText().charCodeAt(0) > 0;
}