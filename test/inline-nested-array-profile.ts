export function hasAnyRole(user: { roles: string[]; profile: { active: boolean } }): boolean {
  if (user.profile.active && user.roles.length > 0) {
    return true;
  }

  return false;
}
