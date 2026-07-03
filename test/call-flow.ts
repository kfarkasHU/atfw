import { createNotifier, ping } from './call-flow-source';

export function callsDependency(value: string) {
  ping(value);
  return 'done';
}

export function callsDependencyTwice(value: string) {
  ping(value);
  ping(value);
  return 'done';
}

export function branchesOnDependency(value: string) {
  return ping(value) ? 'matched' : 'missed';
}

export function callsChainedDependency(value: string) {
  createNotifier().notify(value);
  return 'done';
}