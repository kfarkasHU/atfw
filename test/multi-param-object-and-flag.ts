type User = {
  active: boolean;
  profile: {
    verified: boolean;
  };
};

export function canAccess(user: User, isAdmin: boolean): boolean {
  if (isAdmin && user.active) {
    return true;
  }

  if (user.profile.verified) {
    return true;
  }

  return false;
}
