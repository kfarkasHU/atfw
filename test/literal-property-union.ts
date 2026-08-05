type Input = {
  property: 'A' | 'B';
};

export function readLiteralProperty(input: Input): string {
  return input.property;
}
