import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '@src/common/decorators';
import { ROLES } from '@src/common/constants/roles';
import { RolesGuard } from '@src/common/guards';
import {
  DashboardCourseHighlights,
  DashboardOverview,
} from '@src/common/types';
import { DashboardService } from '@src/modules/dashboard/dashboard.service';

@ApiTags('dashboard')
@ApiBearerAuth()
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get('overview')
  @ApiOperation({ summary: 'Get dashboard overview metrics' })
  @ApiResponse({ status: 200, description: 'Dashboard overview loaded.' })
  async getOverview(): Promise<DashboardOverview> {
    return this.dashboardService.getOverview();
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get('course-highlights')
  @ApiOperation({ summary: 'Get dashboard course leaderboards' })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Maximum number of courses returned per leaderboard.',
  })
  @ApiResponse({ status: 200, description: 'Dashboard highlights loaded.' })
  async getCourseHighlights(
    @Query('limit') limit: number = 5,
  ): Promise<DashboardCourseHighlights> {
    return this.dashboardService.getCourseHighlights(Number(limit) || 5);
  }
}
