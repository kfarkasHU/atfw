export function ping(_value: string): boolean {
  return true;
}

export function createNotifier() {
  return {
    notify(_value: string) {
      return true;
    },
  };
}