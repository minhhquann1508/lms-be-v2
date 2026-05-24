import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UserService } from '@modules/user/user.service';
import { PaginatedResponse, UserFilter } from '@src/common/types';
import { User } from '@src/modules/user/entities/user.entity';
import { ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import {
  OptionalBooleanQuery,
  OptionalBooleanQueryValue,
  CurrentUser,
  Roles,
} from '@src/common/decorators';
import { UpdateUserDto } from '@src/modules/user/dto/update-user.dto';

@Controller('users')
@ApiTags('Users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get()
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'roleCode', required: false, type: String })
  @ApiQuery({ name: 'isActive', required: false, type: Boolean })
  async findAll(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
    @Query('search') search?: string,
    @Query('roleCode') roleCode?: string,
    @OptionalBooleanQuery('isActive')
    isActive?: OptionalBooleanQueryValue,
  ): Promise<PaginatedResponse<User>> {
    const filterOptions: UserFilter = {
      page: Number(page),
      limit: Number(limit),
      search,
      roleCode,
      isActive: isActive as boolean | undefined,
    };
    return await this.userService.findAll(filterOptions);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Get(':userId')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiQuery({ name: 'userId', required: true, type: String })
  async getUserById(@Param('userId') userId: string): Promise<User> {
    return await this.userService.getUserById(userId);
  }

  @Patch('me')
  @ApiOperation({ summary: 'Update current user profile' })
  async updateProfile(
    @CurrentUser('userId') userId: string,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    return await this.userService.updateProfile(userId, updateUserDto);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Patch(':userId/role')
  @ApiOperation({ summary: 'Update user role (admin)' })
  async updateRole(
    @Param('userId') userId: string,
    @Body('roleCode') roleCode: string,
  ): Promise<Omit<User, 'password'>> {
    return await this.userService.updateRole(userId, roleCode);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Patch(':userId/toggle-active')
  @ApiOperation({ summary: 'Toggle user active status (admin)' })
  async toggleActive(
    @Param('userId') userId: string,
  ): Promise<Omit<User, 'password'>> {
    return await this.userService.toggleActive(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post()
  @ApiOperation({ summary: 'Create a new user (admin)' })
  async createUser(
    @Body('email') email: string,
    @Body('password') password: string,
    @Body('fullName') fullName: string,
    @Body('roleCode') roleCode?: string,
  ): Promise<Omit<User, 'password'>> {
    return await this.userService.createUser({
      email,
      password,
      fullName,
      roleCode,
    });
  }

  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Post('bulk-import')
  @ApiOperation({ summary: 'Bulk import users (admin)' })
  async bulkImport(
    @Body('users') users: Array<{ email: string; fullName: string }>,
  ): Promise<{ created: number; skipped: number; errors: string[] }> {
    return await this.userService.bulkImport(users);
  }
}
