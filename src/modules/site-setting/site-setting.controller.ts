import { Body, Controller, Get, Put } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ROLES } from '@src/common/constants/roles';
import { Public, Roles } from '@src/common/decorators';
import { SiteSettingService } from './site-setting.service';
import { UpdateSiteSettingDto } from './dto/update-site-setting.dto';
import { SiteSetting } from './entities/site-setting.entity';

@Controller('site-settings')
@ApiTags('Site Settings')
export class SiteSettingController {
  constructor(private readonly siteSettingService: SiteSettingService) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Get site settings' })
  async getSettings(): Promise<SiteSetting> {
    return this.siteSettingService.getSettings();
  }

  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @Put()
  @ApiOperation({ summary: 'Update site settings (admin)' })
  async updateSettings(
    @Body() dto: UpdateSiteSettingDto,
  ): Promise<SiteSetting> {
    return this.siteSettingService.updateSettings(dto);
  }
}
