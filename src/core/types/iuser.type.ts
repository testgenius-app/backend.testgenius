import { Providers, Role, User } from "@prisma/client";

export interface IUser  {
  id: string;
  role?: Role;
}
