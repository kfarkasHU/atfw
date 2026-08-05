type Input = {
  payload: { id: number } | undefined;
};

export function hasUndefinedPayload(input: Input): number {
  if (input.payload === undefined) {
    return 0;
  }

  return 1;
}