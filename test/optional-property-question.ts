type Input = {
  payload?: {
    id: number;
  };
};

export function hasOptionalProperty(input: Input): number {
  if (input.payload === undefined) {
    return 0;
  }

  return input.payload.id;
}
