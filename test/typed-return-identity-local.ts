export type IdentityUser = {
  active: boolean;
  profile: {
    city: string;
  };
};

export function echoLocalUser(user: IdentityUser): IdentityUser {
  return user;
}
