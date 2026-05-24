import { BadRequestException, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { instance as axios } from '@src/common/helpers/axios-instance';
import { BunnyWebhookDto } from '@src/modules/bunny/dto/webhook.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Lecture } from '@src/modules/lecture/entities/lecture.entity';
import { Repository } from 'typeorm';
import * as fs from 'fs';
import { BunnyVideoDetail } from '@src/common/types';

@Injectable()
export class BunnyService {
  private readonly bunnyLibraryId: string;
  private readonly bunnyStreamIframeUrl: string;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(Lecture)
    private readonly lectureRepository: Repository<Lecture>,
  ) {
    this.bunnyLibraryId =
      this.configService.get<string>('BUNNY_LIBRARY_ID') ?? '';
    this.bunnyStreamIframeUrl =
      this.configService.get<string>('BUNNY_STREAM_IFRAME_URL') ?? '';
  }

  async uploadFileToBunny(
    filePath: string,
  ): Promise<{ videoId: string; videoUrl: string; libraryId: string }> {
    const title = filePath.split('/').pop() ?? 'Untitled Video';

    try {
      console.log('Creating video object...');
      const createResponse = await axios.post(
        `/library/${this.bunnyLibraryId}/videos`,
        { title },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        },
      );
      console.log('Create video object response:', createResponse.status);
      const videoId = createResponse.data.guid;

      // 2. Upload Video Content
      const fileStream = fs.createReadStream(filePath);
      await axios.put(
        `/library/${this.bunnyLibraryId}/videos/${videoId}`,
        fileStream,
        {
          headers: {
            'Content-Type': 'application/octet-stream',
          },
          maxBodyLength: Infinity,
          maxContentLength: Infinity,
          timeout: 3600000, // 1 hour timeout
        },
      );

      const videoUrl = `${this.bunnyStreamIframeUrl}/${this.bunnyLibraryId}/${videoId}`;

      return {
        videoId,
        videoUrl,
        libraryId: this.bunnyLibraryId,
      };
    } catch (error) {
      console.error('Bunny Upload Error:', error.message);
      if (error.response) {
        console.error('Bunny Response Data:', error.response.data);
      }
      throw error; // Re-throw để JobWorker bắt được
    }
  }

  async getBunnyVideoDetail(videoGuid: string): Promise<BunnyVideoDetail> {
    try {
      const response = await axios.get(
        `/library/${this.bunnyLibraryId}/videos/${videoGuid}`,
        {
          timeout: 5000,
        },
      );
      return response.data;
    } catch (error) {
      console.log(error);
      throw new BadRequestException('Failed to get video detail');
    }
  }

  async handleBunnyWebhook(data: BunnyWebhookDto): Promise<void> {
    const { VideoGuid, Status } = data;

    if (Status !== 'READY' && Status !== 3) return;

    const lecture = await this.lectureRepository.findOne({
      where: { attributes: { videoGuid: VideoGuid } },
    });

    if (!lecture) return;

    if (lecture.duration && lecture.duration > 0) return;

    const videoDetail = await this.getBunnyVideoDetail(VideoGuid);

    if (!videoDetail?.length || videoDetail.length <= 0) return;

    const duration = videoDetail.length;

    await this.lectureRepository.update(lecture.id, {
      duration,
      attributes: {
        ...lecture.attributes,
        bunny: data,
      },
    });
  }
}
