import { toMock } from './import-source';

export function toTest() {
  return toMock() ? false : true;
}
