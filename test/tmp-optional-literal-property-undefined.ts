type Input = {
  property?: 'A' | 'B' | undefined;
};

export function tmpOptionalLiteralPropertyUndefined(input: Input): string {
  return input.property ?? 'missing';
}
