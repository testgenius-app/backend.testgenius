import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/common/prisma/prisma.service';
import { Activity, EntityType, ActionType, User } from '@prisma/client';
import { ActivityTranslations } from './interfaces/activity-translations.interface';

export interface ActivityWithActor extends Activity {
  actor: Pick<User, 'id' | 'firstName' | 'lastName' | 'email' | 'logo'>;
}

@Injectable()
export class ActivityService {
  constructor(private prisma: PrismaService) {}

  async logActivity(data: {
    entityType: EntityType;
    actionType: ActionType;
    entityId: string;
    description: ActivityTranslations;
    actorId: string;
    metadata?: any;
  }): Promise<Activity> {
    return this.prisma.activity.create({
      data: {
        entityType: data.entityType,
        actionType: data.actionType,
        entityId: data.entityId,
        description: data.description as any,
        actorId: data.actorId,
        metadata: data.metadata || {},
      },
    });
  }

  async getRecentActivities(
    userId: string,
    entityType?: EntityType,
    limit: number = 10,
  ): Promise<ActivityWithActor[]> {
    return this.prisma.activity.findMany({
      where: {
        actorId: userId,
        ...(entityType && { entityType }),
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getEntityActivities(
    entityId: string,
    entityType: EntityType,
    limit: number = 10,
  ): Promise<ActivityWithActor[]> {
    return this.prisma.activity.findMany({
      where: {
        entityId,
        entityType,
      },
      include: {
        actor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            logo: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
      take: limit,
    });
  }

  async getUserActivities(
    userId: string,
    options: {
      entityType?: EntityType;
      limit?: number;
    } = {},
  ): Promise<ActivityWithActor[]> {
    return this.getRecentActivities(userId, options.entityType, options.limit);
  }
}
