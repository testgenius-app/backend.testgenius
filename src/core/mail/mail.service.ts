import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createTransport } from 'nodemailer';

@Injectable()
export class MailService implements OnModuleInit {
  constructor(private readonly configService: ConfigService) {}

  private transporter = createTransport({
    host: this.configService.get<string>('EMAIL_HOST'),
    port: 465,
    secure: true,
    auth: {
      user: this.configService.get<string>('EMAIL_USER'),
      pass: this.configService.get<string>('EMAIL_PASSWORD'),
    },
  });

  async onModuleInit() {
    await this.transporter.verify();
  }

  sendRegistrationOtp = async (email: string, otp: string) => {
    const otpValidDuration = this.configService.get<number>(
      'OTP_VALID_DURATION_MINUTES',
    );
    return this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to: email,
      subject: '🔐 Verify your Testgenius account',
      html: `
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #4A90E2;">Welcome to Testgenius! 👋</h2>
          <p>Thanks for signing up! To verify your account, please use the OTP below:</p>
          <div style="margin: 20px 0; display: inline-block; background: #f1f1f1; padding: 14px 24px; border-radius: 8px; font-size: 24px; font-weight: bold; color: #4A90E2; letter-spacing: 2px;">
            ${otp}
          </div>
          <p>This code will expire in <strong>${otpValidDuration} minutes</strong>.</p>
          <p>If you didn’t create this account, you can safely ignore this email.</p>
          <br/>
          <p style="font-size: 14px; color: #888;">Best regards,<br/>The Testgenius Team</p>
        </div>
      </body>
    `,
    });
  };
  sendRestoreAccountOtp = async (email: string, otp: string) => {
    const otpValidDuration = this.configService.get<number>(
      'OTP_VALID_DURATION_MINUTES',
    );
    return this.transporter.sendMail({
      from: this.configService.get<string>('EMAIL_FROM'),
      to: email,
      subject: '🔄 Restore your Testgenius account',
      html: `
      <body style="font-family: Arial, sans-serif; color: #333;">
        <div style="max-width: 600px; margin: auto; padding: 24px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #F5A623;">Account Recovery Request</h2>
          <p>We received a request to restore access to your Testgenius account.</p>
          <p>Use the OTP below to continue:</p>
          <div style="margin: 20px 0; display: inline-block; background: #fff4e5; padding: 14px 24px; border-radius: 8px; font-size: 24px; font-weight: bold; color: #F5A623; letter-spacing: 2px;">
            ${otp}
          </div>
          <p style="font-size: 14px; color: #666;">(Please select and copy the code manually)</p>
          <p>This code will expire in <strong>${otpValidDuration} minutes</strong>.</p>
          <p>If you didn’t request to recover your account, please ignore this message.</p>
          <br/>
          <p style="font-size: 14px; color: #888;">With care,<br/>The Testgenius Support Team</p>
        </div>
      </body>
    `,
    });
  };
}
