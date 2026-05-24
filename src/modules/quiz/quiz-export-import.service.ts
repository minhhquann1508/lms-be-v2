import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { Quiz } from '@src/modules/quiz/entities/quiz.entity';
import { Question } from '@src/modules/quiz/entities/question.entity';
import { QuestionOption } from '@src/modules/quiz/entities/question-option.entity';
import { Course } from '@src/modules/course/entities/course.entity';
import { generateSlug } from '@src/common/helpers';
import { ValidationErrorCode } from '@src/common/constants';
import { QuizFilter } from '@src/common/types';
import {
  HEADER_FILL,
  ORANGE_HEADER_FILL,
  ALT_ROW_FILL,
  createHeaderCellStyle,
  createNormalCellStyle,
  createCorrectCellStyle,
  applyAltRowFill,
} from '@src/modules/quiz/helpers/quiz-excel-styles';

interface QuizRow {
  stt: number;
  title: string;
  description: string;
  type: string;
  duration: number | null;
  passingScore: number | null;
  isPublished: string;
  courseName: string;
  createdAt: string;
}

interface QuestionRow {
  stt: number;
  content: string;
  points: number;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctOption: string;
}

export interface ImportResult {
  created: number;
  skipped: number;
  errors: { row: number; message: string }[];
}

interface ParsedQuiz {
  title: string;
  description: string;
  type: string;
  duration: number | null;
  passingScore: number | null;
  isPublished: boolean;
  courseName: string;
  courseId?: string;
  questions: {
    content: string;
    type: string;
    points: number;
    options: { content: string; isCorrect: boolean; order: number }[];
  }[];
}

@Injectable()
export class QuizExportImportService {
  constructor(
    @InjectRepository(Quiz)
    private readonly quizRepository: Repository<Quiz>,
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(QuestionOption)
    private readonly optionRepository: Repository<QuestionOption>,
    @InjectRepository(Course)
    private readonly courseRepository: Repository<Course>,
    private readonly dataSource: DataSource,
  ) {}

  async exportQuizList(filter?: QuizFilter): Promise<ExcelJS.Workbook> {
    const page = filter?.page ?? 1;
    const limit = filter?.limit ?? 1000;

    const qb = this.quizRepository
      .createQueryBuilder('quiz')
      .leftJoinAndSelect('quiz.course', 'course')
      .leftJoinAndSelect('quiz.chapter', 'chapter')
      .orderBy('quiz.createdAt', 'DESC');

    if (filter?.search) {
      qb.andWhere('quiz.title ILIKE :search', { search: `%${filter.search}%` });
    }
    if (filter?.type) {
      qb.andWhere('quiz.type = :type', { type: filter.type });
    }
    if (filter?.courseId) {
      qb.andWhere('quiz.course_id = :courseId', { courseId: filter.courseId });
    }

    qb.skip((page - 1) * limit).take(limit);
    const quizzes = await qb.getMany();

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LMS Admin';
    workbook.created = new Date();

    const sheet = workbook.addWorksheet('Danh sách Quiz', {
      properties: { defaultColWidth: 18 },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const headers: (keyof QuizRow)[] = [
      'stt',
      'title',
      'description',
      'type',
      'duration',
      'passingScore',
      'isPublished',
      'courseName',
      'createdAt',
    ];

    const headerLabels: Record<keyof QuizRow, string> = {
      stt: 'STT',
      title: 'Tiêu đề',
      description: 'Mô tả',
      type: 'Loại',
      duration: 'Thời gian (phút)',
      passingScore: 'Điểm đạt (%)',
      isPublished: 'Trạng thái',
      courseName: 'Khóa học',
      createdAt: 'Ngày tạo',
    };

    const headerRow = sheet.addRow(headers.map((h) => headerLabels[h]));
    headerRow.height = 32;
    headers.forEach((_, i) => {
      const cell = headerRow.getCell(i + 1);
      cell.style = createHeaderCellStyle();
    });

    quizzes.forEach((quiz, index) => {
      const rowData: QuizRow = {
        stt: index + 1,
        title: quiz.title,
        description: quiz.description ?? '',
        type: quiz.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Coding',
        duration: quiz.duration ? Math.round(quiz.duration / 60) : null,
        passingScore: quiz.passingScore ?? null,
        isPublished: quiz.isPublished ? 'Đã xuất bản' : 'Nháp',
        courseName: quiz.course?.name ?? '',
        createdAt: new Date(quiz.createdAt).toLocaleDateString('vi-VN'),
      };

      const row = sheet.addRow(headers.map((h) => rowData[h] ?? ''));
      row.height = 28;

      if (index % 2 === 1) {
        headers.forEach((_, i) => {
          const cell = row.getCell(i + 1);
          cell.style = applyAltRowFill(ALT_ROW_FILL);
        });
      } else {
        headers.forEach((_, i) => {
          const cell = row.getCell(i + 1);
          cell.style = createNormalCellStyle();
        });
      }
    });

    const colWidths: Partial<Record<keyof QuizRow, number>> = {
      stt: 8,
      title: 45,
      description: 55,
      type: 16,
      duration: 16,
      passingScore: 14,
      isPublished: 16,
      courseName: 35,
      createdAt: 16,
    };
    headers.forEach((h, i) => {
      const w = colWidths[h] ?? 20;
      sheet.getColumn(i + 1).width = w;
    });

    return workbook;
  }

  async exportQuizDetail(quizId: string): Promise<ExcelJS.Workbook> {
    const quiz = await this.quizRepository.findOne({
      where: { id: quizId },
      relations: ['course', 'chapter', 'questions', 'questions.options'],
      order: { questions: { order: 'ASC', options: { order: 'ASC' } } },
    });

    if (!quiz) {
      throw new BadRequestException(ValidationErrorCode.QUIZ_NOT_FOUND);
    }

    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LMS Admin';
    workbook.created = new Date();

    const infoSheet = workbook.addWorksheet('Thông tin Quiz', {
      properties: { defaultColWidth: 22 },
    });

    const infoData = [
      ['Tiêu đề', quiz.title],
      ['Mô tả', quiz.description ?? ''],
      ['Loại', quiz.type === 'multiple_choice' ? 'Trắc nghiệm' : 'Coding'],
      ['Thời gian (phút)', quiz.duration ? Math.round(quiz.duration / 60) : ''],
      ['Điểm đạt (%)', quiz.passingScore ?? ''],
      ['Trạng thái', quiz.isPublished ? 'Đã xuất bản' : 'Nháp'],
      ['Slug', quiz.slug],
      ['Khóa học', quiz.course?.name ?? ''],
      ['Chương', quiz.chapter?.name ?? ''],
      ['Ngày tạo', new Date(quiz.createdAt).toLocaleDateString('vi-VN')],
      [
        'Cập nhật lần cuối',
        new Date(quiz.updatedAt).toLocaleDateString('vi-VN'),
      ],
    ];

    const infoHeader = infoSheet.addRow(['Trường', 'Giá trị']);
    infoHeader.height = 28;
    [1, 2].forEach((i) => {
      infoSheet.getCell(`${String.fromCharCode(64 + i)}${1}`).style =
        createHeaderCellStyle();
    });

    infoData.forEach((rowData, rowIndex) => {
      const row = infoSheet.addRow(rowData);
      row.height = 24;
      [1, 2].forEach((colIndex) => {
        const cell = row.getCell(colIndex);
        cell.style = createNormalCellStyle();
        if (rowIndex % 2 === 1) {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFF2F2F2' },
          };
        }
      });
    });

    infoSheet.getColumn(1).width = 28;
    infoSheet.getColumn(2).width = 55;

    const questionsSheet = workbook.addWorksheet('Câu hỏi', {
      properties: { defaultColWidth: 18 },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const questionHeaders = [
      'STT',
      'Nội dung câu hỏi',
      'Điểm',
      'Đáp án A',
      'Đáp án B',
      'Đáp án C',
      'Đáp án D',
      'Đáp án đúng',
    ];
    const qHeaderRow = questionsSheet.addRow(questionHeaders);
    qHeaderRow.height = 32;
    qHeaderRow.eachCell((cell) => {
      cell.style = createHeaderCellStyle(ORANGE_HEADER_FILL);
    });

    quiz.questions.forEach((question, qIndex) => {
      const sortedOptions = [...question.options].sort(
        (a, b) => a.order - b.order,
      );
      const optionContents = sortedOptions.map((o) => o.content);
      const correctIdx = sortedOptions.findIndex((o) => o.isCorrect);
      const correctLetter =
        correctIdx >= 0 ? String.fromCharCode(65 + correctIdx) : '';

      const rowData: QuestionRow = {
        stt: qIndex + 1,
        content: question.content,
        points: question.points,
        optionA: optionContents[0] || '',
        optionB: optionContents[1] || '',
        optionC: optionContents[2] || '',
        optionD: optionContents[3] || '',
        correctOption: correctLetter,
      };

      const row = questionsSheet.addRow([
        rowData.stt,
        rowData.content,
        rowData.points,
        rowData.optionA,
        rowData.optionB,
        rowData.optionC,
        rowData.optionD,
        rowData.correctOption,
      ]);
      row.height = 30;

      row.eachCell((cell, colIndex) => {
        if (correctLetter && colIndex <= 7) {
          const isCorrectCol =
            colIndex === 7 ||
            (correctLetter === 'A' && colIndex === 4) ||
            (correctLetter === 'B' && colIndex === 5) ||
            (correctLetter === 'C' && colIndex === 6) ||
            (correctLetter === 'D' && colIndex === 7);
          if (isCorrectCol && colIndex === 4 + correctIdx) {
            cell.style = createCorrectCellStyle();
          } else {
            cell.style = createNormalCellStyle();
          }
        } else {
          cell.style = createNormalCellStyle();
        }
      });
    });

    const colWidthsQ: number[] = [8, 55, 8, 30, 30, 30, 30, 14];
    colWidthsQ.forEach((w, i) => {
      questionsSheet.getColumn(i + 1).width = w;
    });

    return workbook;
  }

  async generateTemplate(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'LMS Admin';
    workbook.created = new Date();

    const quizzesSheet = workbook.addWorksheet('Danh sách Quiz', {
      properties: { defaultColWidth: 22 },
      views: [{ state: 'frozen', ySplit: 1 }],
    });

    const quizHeaders = [
      'Tiêu đề',
      'Mô tả',
      'Loại',
      'Thời gian (phút)',
      'Điểm đạt (%)',
      'Trạng thái',
      'Tên khóa học',
    ];
    const qHeaderRow = quizzesSheet.addRow(quizHeaders);
    qHeaderRow.height = 28;
    qHeaderRow.eachCell((cell) => {
      cell.style = createHeaderCellStyle(HEADER_FILL);
    });

    const sampleRows = [
      [
        'Bài kiểm tra JavaScript',
        'Kiểm tra kiến thức JS cơ bản',
        'multiple_choice',
        '15',
        '80',
        'false',
        'JavaScript Basics',
      ],
      [
        'Bài kiểm tra Python',
        'Kiểm tra Python nâng cao',
        'coding',
        '60',
        '70',
        'true',
        'Python for Beginners',
      ],
    ];
    sampleRows.forEach((rowData, rowIndex) => {
      const row = quizzesSheet.addRow(rowData);
      row.height = 24;
      row.eachCell((cell) => {
        cell.style =
          rowIndex % 2 === 1
            ? applyAltRowFill(ALT_ROW_FILL)
            : createNormalCellStyle();
      });
    });

    quizzesSheet.addRow([]);
    quizzesSheet.addRow([
      'Các giá trị hợp lệ cho cột "Loại": multiple_choice, coding',
    ]);
    quizzesSheet.addRow([
      'Các giá trị hợp lệ cho cột "Trạng thái": true, false',
    ]);
    quizzesSheet.addRow([
      'Cột "Tên khóa học" phải khớp với tên khóa học đã có trong hệ thống.',
    ]);

    const instructionsSheet = workbook.addWorksheet('Hướng dẫn', {
      properties: { defaultColWidth: 25 },
    });

    const instructions = [
      ['HƯỚNG DẪN IMPORT QUIZ', ''],
      ['', ''],
      ['1. QUY TẮC CHUNG', ''],
      ['   - Sheet "Danh sách Quiz" là sheet chính để import dữ liệu.', ''],
      ['   - Cột "Tiêu đề" là bắt buộc. Các cột khác là tùy chọn.', ''],
      [
        '   - Nếu cột "Tên khóa học" không khớp với khóa học có sẵn, quiz sẽ không được gắn khóa học.',
        '',
      ],
      ['', ''],
      ['2. CÁC TRƯỜNG HỢP LỆ', ''],
      [
        '   - Loại: "multiple_choice" (trắc nghiệm) hoặc "coding". Mặc định: multiple_choice',
        '',
      ],
      [
        '   - Thời gian: số nguyên (phút). VD: 15 = 15 phút. Để trống = không giới hạn.',
        '',
      ],
      ['   - Điểm đạt: số nguyên 0-100 (%). Để trống = không yêu cầu.', ''],
      [
        '   - Trạng thái: "true" = xuất bản, "false" = nháp. Mặc định: false',
        '',
      ],
      ['', ''],
      ['3. CÁCH TẠO QUIZ MỚI', ''],
      ['   - Thêm 1 dòng cho mỗi quiz trong sheet "Danh sách Quiz".', ''],
      ['   - Quiz trùng tiêu đề sẽ được bỏ qua (không tạo mới).', ''],
      ['', ''],
      ['4. VÍ DỤ', ''],
      ['   VD1: Tạo quiz trắc nghiệm 15 phút, điểm đạt 80%, nháp:', ''],
      [
        '   Tiêu đề | Mô tả | Loại | Thời gian | Điểm đạt | Trạng thái | Tên khóa học',
        '',
      ],
      [
        '   Quiz JS | Kiểm tra JS | multiple_choice | 15 | 80 | false | JavaScript Basics',
        '',
      ],
    ];

    instructions.forEach((rowData) => {
      const row = instructionsSheet.addRow(rowData);
      if (rowData[0].startsWith('HƯỚNG DẪN')) {
        row.getCell(1).font = {
          name: 'Arial',
          size: 14,
          bold: true,
          color: { argb: 'FF4472C4' },
        };
      } else if (rowData[0].match(/^[0-9]\./)) {
        row.getCell(1).font = { name: 'Arial', size: 11, bold: true };
      }
    });

    instructionsSheet.getColumn(1).width = 80;
    instructionsSheet.getColumn(2).width = 60;

    return workbook;
  }

  async importQuizzes(file: Express.Multer.File): Promise<ImportResult> {
    const errors: { row: number; message: string }[] = [];
    let created = 0;
    let skipped = 0;

    const workbook = new ExcelJS.Workbook();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await workbook.xlsx.load(file.buffer as any);

    const sheet = workbook.getWorksheet('Danh sách Quiz');
    if (!sheet) {
      throw new BadRequestException(
        'File Excel phải có sheet "Danh sách Quiz"',
      );
    }

    const rows: ExcelJS.Row[] = [];
    sheet.eachRow((row, rowNumber) => {
      if (rowNumber > 1 && row.getCell(1).text?.trim()) {
        rows.push(row);
      }
    });

    const quizzes: ParsedQuiz[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNum = i + 2;

      const title = row.getCell(1).text?.trim() ?? '';
      if (!title) {
        errors.push({
          row: rowNum,
          message: 'Tiêu đề quiz không được để trống',
        });
        skipped++;
        continue;
      }

      const description = row.getCell(2).text?.trim() ?? '';
      const typeRaw =
        row.getCell(3).text?.trim().toLowerCase() ?? 'multiple_choice';
      const type = typeRaw === 'coding' ? 'coding' : 'multiple_choice';

      const durationStr = row.getCell(4).text?.trim();
      const duration = durationStr ? parseInt(durationStr, 10) : null;

      const passingScoreStr = row.getCell(5).text?.trim();
      const passingScore = passingScoreStr
        ? parseInt(passingScoreStr, 10)
        : null;

      const isPublishedRaw = row.getCell(6).text?.trim().toLowerCase();
      const isPublished = isPublishedRaw === 'true';

      const courseName = row.getCell(7).text?.trim() ?? '';

      quizzes.push({
        title,
        description,
        type,
        duration,
        passingScore,
        isPublished,
        courseName,
        questions: [],
      });
    }

    for (const quiz of quizzes) {
      if (!quiz.courseName) continue;
      const course = await this.courseRepository.findOne({
        where: { name: quiz.courseName },
      });
      if (course) {
        quiz.courseId = course.id;
      }
    }

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (const quizData of quizzes) {
        const existing = await queryRunner.manager.findOne(Quiz, {
          where: { title: quizData.title },
          withDeleted: true,
        });
        if (existing) {
          skipped++;
          continue;
        }

        const quiz = queryRunner.manager.create(Quiz, {
          title: quizData.title,
          description: quizData.description,
          type: quizData.type,
          duration: quizData.duration ?? undefined,
          passingScore: quizData.passingScore ?? undefined,
          isPublished: quizData.isPublished,
          slug: generateSlug(quizData.title),
          courseId: quizData.courseId,
        });

        await queryRunner.manager.save(quiz);
        created++;
      }

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      throw err;
    } finally {
      await queryRunner.release();
    }

    return { created, skipped, errors };
  }
}
