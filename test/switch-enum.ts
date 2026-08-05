enum Status {
  Ready = `READY`,
  Busy = `BUSY`,
}

export function mapEnumSwitch(value: string): number {
  switch (value) {
    case Status.Ready:
      return 100;
    case Status.Busy:
      return 200;
    default:
      return 300;
  }
}