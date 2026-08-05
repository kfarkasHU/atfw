type Input = {
  id: number;
};

export function hasOptionalArg(input?: Input): number {
  if (input === undefined) {
    return 0;
  }

  return input.id;
}
