import { Injectable, Logger } from '@nestjs/common';
import nodemailer, { type Transporter } from 'nodemailer';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private transporter: Transporter | null = null;

  constructor() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT ?? 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      this.logger.warn(
        'SMTP chưa được cấu hình đầy đủ. Email phản hồi sẽ được bỏ qua.',
      );
      return;
    }

    this.transporter = nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  async sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
    if (!this.transporter) {
      return;
    }

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject: 'Đặt lại mật khẩu LMS Platform',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Yêu cầu đặt lại mật khẩu</h2>
          <p>Bạn vừa yêu cầu đặt lại mật khẩu cho tài khoản LMS Platform.</p>
          <p>Vui lòng nhấn vào nút bên dưới để đặt lại mật khẩu (liên kết có hiệu lực trong 1 giờ):</p>
          <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #1677ff; color: white; text-decoration: none; border-radius: 8px; margin: 12px 0;">Đặt lại mật khẩu</a>
          <p style="color: #6b7280; font-size: 13px;">Nếu bạn không yêu cầu đặt lại mật khẩu, vui lòng bỏ qua email này.</p>
        </div>
      `,
    });
  }

  async sendEnrollmentReviewEmail(payload: {
    to: string;
    learnerName: string;
    courseName: string;
    approved: boolean;
    reviewNote?: string | null;
  }): Promise<void> {
    if (!this.transporter) {
      return;
    }

    const { approved, courseName, learnerName, reviewNote, to } = payload;
    const subject = approved
      ? `Yêu cầu ghi danh đã được chấp nhận: ${courseName}`
      : `Yêu cầu ghi danh chưa được chấp nhận: ${courseName}`;
    const heading = approved
      ? 'Bạn đã được duyệt vào khoá học'
      : 'Yêu cầu ghi danh chưa được duyệt';
    const body = approved
      ? 'Bạn đã có thể truy cập trang học của khoá học này.'
      : 'Hiện tại bạn chưa thể truy cập trang học của khoá học này.';

    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">${heading}</h2>
          <p>Xin chào ${learnerName},</p>
          <p>${body}</p>
          <p><strong>Khoá học:</strong> ${courseName}</p>
          ${
            reviewNote?.trim()
              ? `<p><strong>Phản hồi:</strong> ${reviewNote.trim()}</p>`
              : ''
          }
          <p>Vui lòng đăng nhập lại hệ thống để kiểm tra trạng thái mới nhất.</p>
        </div>
      `,
    });
  }
}
