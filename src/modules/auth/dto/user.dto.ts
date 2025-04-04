import { Role } from "@prisma/client";

export class UserDto {
  id: string;
  firstName: string;
  lastName?: string;
  email: string;
  logo?: string;
  coins: number;
  lastActiveDate: Date;
  role: Role;
  createdAt: Date;
  updatedAt: Date;
  isVerified: boolean;
}
