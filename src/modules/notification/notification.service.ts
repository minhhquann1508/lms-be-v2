import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaginatedResponse } from '@src/common/types';
import { Repository } from 'typeorm';
import { Notification } from './entities/notification.entity';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
  ) {}

  async create(data: {
    userId: string;
    title: string;
    message: string;
    type: string;
    link?: string | null;
    relatedEnrollmentId?: string | null;
  }): Promise<Notification> {
    const notification = this.notificationRepository.create({
      ...data,
      isRead: false,
      link: data.link ?? null,
      relatedEnrollmentId: data.relatedEnrollmentId ?? null,
    });

    return this.notificationRepository.save(notification);
  }

  async getMyNotifications(
    userId: string,
    page = 1,
    limit = 10,
  ): Promise<PaginatedResponse<Notification>> {
    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items,
      total,
      page,
      limit,
    };
  }

  async markAsRead(notificationId: string, userId: string): Promise<void> {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true },
    );
  }
}
