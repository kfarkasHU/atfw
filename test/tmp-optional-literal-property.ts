type Input = {
  property?: 'A' | 'B';
};

export function tmpOptionalLiteralProperty(input: Input): string {
  return input.property ?? 'missing';
}
