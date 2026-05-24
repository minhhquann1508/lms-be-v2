import {
  BadRequestException,
  Controller,
  Get,
  Post,
  Param,
  Res,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Response } from 'express';
import { FileInterceptor } from '@nestjs/platform-express';
import { Roles } from '@src/common/decorators';
import { RolesGuard } from '@src/common/guards';
import { ROLES } from '@src/common/constants/roles';
import {
  QuizExportImportService,
  ImportResult,
} from '@src/modules/quiz/quiz-export-import.service';

@ApiTags('quiz-manage')
@Controller('quiz-manage')
export class QuizManageController {
  constructor(private readonly exportImportService: QuizExportImportService) {}

  @Get('export-list')
  @ApiOperation({ summary: 'Export quizzes list as Excel' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  async exportQuizzes(@Res() res: Response): Promise<void> {
    const workbook = await this.exportImportService.exportQuizList({
      limit: 1000,
    });
    const filename = `quizzes-export-${Date.now()}.xlsx`;
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('import-template')
  @ApiOperation({ summary: 'Download quiz import template' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  async downloadTemplate(@Res() res: Response): Promise<void> {
    const workbook = await this.exportImportService.generateTemplate();
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      'attachment; filename="quiz-import-template.xlsx"',
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  @Get('export-detail/:quizId')
  @ApiOperation({ summary: 'Export single quiz with questions as Excel' })
  @ApiBearerAuth()
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  async exportQuizDetail(
    @Param('quizId') quizId: string,
    @Res() res: Response,
  ): Promise<void> {
    const workbook = await this.exportImportService.exportQuizDetail(quizId);
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="quiz-${quizId}-detail.xlsx"`,
    );
    await workbook.xlsx.write(res);
    res.end();
  }

  @Post('import')
  @ApiOperation({ summary: 'Import quizzes from Excel file' })
  @ApiBearerAuth()
  @ApiConsumes('multipart/form-data')
  @UseGuards(RolesGuard)
  @Roles(ROLES.SUPER_ADMIN, ROLES.ADMIN)
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 10 * 1024 * 1024 },
      fileFilter: (_req, file, cb) => {
        if (!file.originalname.match(/\.(xlsx|xls)$/)) {
          cb(new Error('Chỉ chấp nhận file Excel (.xlsx, .xls)'), false);
          return;
        }
        cb(null, true);
      },
    }),
  )
  async importQuizzes(
    @UploadedFile() file: Express.Multer.File,
  ): Promise<ImportResult> {
    if (!file) {
      throw new BadRequestException('File Excel là bắt buộc');
    }
    return this.exportImportService.importQuizzes(file);
  }
}
