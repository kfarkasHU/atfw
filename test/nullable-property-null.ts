type Input = {
  payload: { id: number } | null;
};

export function hasNullPayload(input: Input): number {
  if (input.payload === null) {
    return 0;
  }

  return 1;
}