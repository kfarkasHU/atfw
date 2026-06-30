export function isAdmin(role: string) {
  return role === 'admin';
}

export function isNotAdmin(role: string) {
  return role !== 'admin';
}

export function isBlocked(user: { blocked: boolean }) {
  return user.blocked;
}