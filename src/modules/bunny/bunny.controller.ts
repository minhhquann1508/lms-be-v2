import { Body, Controller, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '@src/common/decorators';
import { BunnyService } from '@src/modules/bunny/bunny.service';
import { BunnyWebhookDto } from '@src/modules/bunny/dto/webhook.dto';

@Controller('bunny')
export class BunnyController {
  constructor(private readonly bunnyService: BunnyService) {}

  @Post('webhook')
  @Public()
  @ApiOperation({ summary: 'Handle Bunny Webhook' })
  @ApiResponse({ status: 200, description: 'Webhook processed successfully' })
  @ApiResponse({ status: 400, description: 'Bad request - Invalid input data' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 403, description: 'Forbidden - Admin role required' })
  async handleWebhook(@Body() data: BunnyWebhookDto): Promise<void> {
    return await this.bunnyService.handleBunnyWebhook(data);
  }
}
