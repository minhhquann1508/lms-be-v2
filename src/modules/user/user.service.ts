import {
  BadRequestException,
  Injectable,
  ConflictException,
} from '@nestjs/common';
import { PaginatedResponse, UserFilter } from '@src/common/types';
import { User } from '@src/modules/user/entities/user.entity';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ValidationErrorCode } from '@src/common/constants';
import { ROLES } from '@src/common/constants/roles';
import { UpdateUserDto } from '@src/modules/user/dto/update-user.dto';
import { HashService } from '@src/common/security/hash/hash.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly hashService: HashService,
  ) {}
  async findAll(filterOptions: UserFilter): Promise<PaginatedResponse<User>> {
    const { page = 1, limit = 10, search, roleCode, isActive } = filterOptions;
    const queryBuilder = this.userRepository
      .createQueryBuilder('user')
      .orderBy('user.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (search) {
      queryBuilder.andWhere(
        '(user.username LIKE :search OR user.email LIKE :search)',
        {
          search: `%${search}%`,
        },
      );
    }
    if (roleCode) {
      queryBuilder.andWhere('user.roleCode = :roleCode', { roleCode });
    }
    if (isActive !== undefined) {
      queryBuilder.andWhere('user.isActive = :isActive', { isActive });
    }
    const [items, total] = await queryBuilder.getManyAndCount();
    return {
      items,
      total,
      page,
      limit,
    };
  }

  async getUserById(userId: string): Promise<User> {
    const user = await this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.enrollments', 'enrollment')
      .leftJoinAndSelect('enrollment.course', 'course')
      .where('user.id = :userId', { userId })
      .getOne();

    if (!user) {
      throw new BadRequestException(ValidationErrorCode.USER_NOT_FOUND);
    }

    return user;
  }

  async updateProfile(
    userId: string,
    data: UpdateUserDto,
  ): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException(ValidationErrorCode.USER_NOT_FOUND);
    }

    if (data.fullName !== undefined) {
      user.fullName = data.fullName;
    }

    if (data.avatar !== undefined) {
      user.avatar = data.avatar ?? null;
    }

    const updatedUser = await this.userRepository.save(user);
    const { password: _password, ...userInfo } = updatedUser;
    return userInfo;
  }

  async updateRole(
    userId: string,
    roleCode: string,
  ): Promise<Omit<User, 'password'>> {
    const VALID_ROLES = [ROLES.USER, ROLES.ADMIN, ROLES.SUPER_ADMIN];
    if (!VALID_ROLES.includes(roleCode)) {
      throw new BadRequestException('Vai trò không hợp lệ');
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(ValidationErrorCode.USER_NOT_FOUND);
    }

    user.roleCode = roleCode;
    const savedUser = await this.userRepository.save(user);
    const { password: _password, ...userInfo } = savedUser;
    return userInfo;
  }

  async toggleActive(userId: string): Promise<Omit<User, 'password'>> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new BadRequestException(ValidationErrorCode.USER_NOT_FOUND);
    }

    user.isActive = !user.isActive;
    const savedUser = await this.userRepository.save(user);
    const { password: _password, ...userInfo } = savedUser;
    return userInfo;
  }

  async createUser(data: {
    email: string;
    password: string;
    fullName: string;
    roleCode?: string;
  }): Promise<Omit<User, 'password'>> {
    const existing = await this.userRepository.findOne({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException(ValidationErrorCode.USER_ALREADY_EXISTS);
    }

    const hashedPassword = await this.hashService.hash(data.password);
    const user = this.userRepository.create({
      email: data.email,
      password: hashedPassword,
      fullName: data.fullName,
      roleCode: data.roleCode || ROLES.USER,
    });

    const savedUser = await this.userRepository.save(user);
    const { password: _password, ...userInfo } = savedUser;
    return userInfo;
  }

  async bulkImport(users: Array<{ email: string; fullName: string }>): Promise<{
    created: number;
    skipped: number;
    errors: string[];
  }> {
    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (const item of users) {
      try {
        if (!item.email || !item.fullName) {
          errors.push(`Dòng thiếu dữ liệu: ${JSON.stringify(item)}`);
          skipped++;
          continue;
        }

        const existing = await this.userRepository.findOne({
          where: { email: item.email },
        });

        if (existing) {
          skipped++;
          continue;
        }

        const randomPassword = `${Math.random().toString(36).slice(-8)}A1!`;
        const hashedPassword = await this.hashService.hash(randomPassword);
        const user = this.userRepository.create({
          email: item.email,
          password: hashedPassword,
          fullName: item.fullName,
          roleCode: ROLES.USER,
        });

        await this.userRepository.save(user);
        created++;
      } catch {
        errors.push(`Không thể tạo người dùng: ${item.email}`);
        skipped++;
      }
    }

    return { created, skipped, errors };
  }
}
