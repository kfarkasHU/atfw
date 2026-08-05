export function mapStringSwitch(value: string): number {
  switch (value) {
    case `A`:
      return 0;
    case `B`:
      return 1;
    default:
      return 2;
  }
}