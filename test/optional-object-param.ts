type Input = {
  flag?: boolean;
  meta?: boolean;
};

export function isReady(input?: Input | boolean): boolean | null {
  if (!input) {
    return false;
  }

  if (typeof input === `boolean`) {
    return input;
  }

  if (input.meta !== undefined) {
    return input.meta ? true : null;
  }

  return input.flag ?? null;
}
