import { Injectable } from '@nestjs/common';
import { CreateDeviceDto } from '@modules/device/dto/create-device.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Device } from '@modules/device/entities/device.entity';
import { Repository } from 'typeorm';

@Injectable()
export class DeviceService {
  constructor(
    @InjectRepository(Device)
    private readonly deviceRepository: Repository<Device>,
  ) {}
  async createNewDevice(
    createDeviceDto: CreateDeviceDto,
    userId: string,
  ): Promise<Device> {
    const device = this.deviceRepository.create({
      ...createDeviceDto,
      userId,
      lastLoginAt: new Date(),
    });
    return await this.deviceRepository.save(device);
  }

  async findDeviceByUidAndUserId(
    uid: string,
    userId: string,
  ): Promise<Device | null> {
    const device = await this.deviceRepository.findOne({
      where: {
        deviceUid: uid,
        userId,
      },
    });
    return device;
  }

  async updateDevice(device: Device): Promise<Device> {
    return await this.deviceRepository.save(device);
  }

  /**
   * R5.AC4, R5.AC5 — Return all devices belonging to a user, ordered by lastLoginAt DESC.
   * The Device entity does not contain refreshTokenHash, so no secret leakage.
   */
  async findByUserId(userId: string): Promise<Device[]> {
    return await this.deviceRepository.find({
      where: { userId },
      order: { lastLoginAt: 'DESC' },
    });
  }

  /**
   * R2.AC4-5 — Update only whitelisted metadata fields for a device.
   * DOES NOT accept or overwrite `deviceUid`.
   * Tách ra để tránh `Object.assign(existing, dto)` vô tình ghi đè deviceUid.
   */
  async updateDeviceLoginMetadata(
    deviceId: string,
    fields: {
      deviceName?: string;
      deviceType?: string;
      os?: string;
      browser?: string;
      ipAddress?: string;
      userAgent?: string;
      lastLoginAt: Date;
    },
  ): Promise<Device> {
    await this.deviceRepository.update({ id: deviceId }, fields);
    return await this.deviceRepository.findOneOrFail({
      where: { id: deviceId },
    });
  }
}
