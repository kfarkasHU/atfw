type Input = {
  property: 'A' | 'B' | null;
};

export function readLiteralPropertyNullable(input: Input): string {
  return input.property ?? `missing`;
}
