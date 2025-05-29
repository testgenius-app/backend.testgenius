import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/common/prisma/prisma.service";
import { CreateActivityDto } from "./dto/create-activity.dto";
import { Activity, Prisma, EntityType, ActionType } from "@prisma/client";

@Injectable()
export class ActivityRepository {
  constructor(private readonly prismaService: PrismaService) {}

  async createActivity(data: CreateActivityDto): Promise<Activity> {
    return this.prismaService.activity.create({
      data,
      include: {
        actor: true,
        target: true,
      },
    });
  }

  async findUserActivities(
    userId: string,
    options: {
      skip?: number;
      take?: number;
      entityType?: EntityType;
      actionType?: ActionType;
    } = {},
  ): Promise<Activity[]> {
    const { skip = 0, take = 10, entityType, actionType } = options;

    const where: Prisma.ActivityWhereInput = {
      OR: [
        { actorId: userId },
        { targetId: userId },
      ],
      ...(entityType && { entityType }),
      ...(actionType && { actionType }),
    };

    return this.prismaService.activity.findMany({
      where,
      include: {
        actor: true,
        target: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }

  async findEntityActivities(
    entityId: string,
    entityType: EntityType,
    options: {
      skip?: number;
      take?: number;
      actionType?: ActionType;
    } = {},
  ): Promise<Activity[]> {
    const { skip = 0, take = 10, actionType } = options;

    const where: Prisma.ActivityWhereInput = {
      entityId,
      entityType,
      ...(actionType && { actionType }),
    };

    return this.prismaService.activity.findMany({
      where,
      include: {
        actor: true,
        target: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
      skip,
      take,
    });
  }
}