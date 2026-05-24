import { Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '@src/common/decorators';
import { AccessTokenPayload, PaginatedResponse } from '@src/common/types';
import { Notification } from './entities/notification.entity';
import { NotificationService } from './notification.service';

@ApiTags('notifications')
@Controller('notifications')
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get('my')
  @ApiOperation({ summary: 'Get current user notifications' })
  @ApiResponse({ status: 200, description: 'List of notifications' })
  async getMyNotifications(
    @CurrentUser() user: AccessTokenPayload,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<PaginatedResponse<Notification>> {
    return this.notificationService.getMyNotifications(
      user.userId,
      Number(page),
      Number(limit),
    );
  }

  @Patch(':notificationId/read')
  @ApiOperation({ summary: 'Mark a notification as read' })
  @ApiResponse({ status: 200, description: 'Notification marked as read' })
  async markAsRead(
    @Param('notificationId') notificationId: string,
    @CurrentUser() user: AccessTokenPayload,
  ): Promise<void> {
    await this.notificationService.markAsRead(notificationId, user.userId);
  }
}
