import nodemailer from 'nodemailer';

// QQ邮箱 SMTP 配置 - 强制使用 IPv4
const transporter = nodemailer.createTransport({
  host: 'smtp.qq.com',
  port: 465,
  secure: true,
  family: 4, // 强制使用 IPv4
  auth: {
    user: '428738807@qq.com',
    pass: 'zjtlcblnqyozbged', // 授权码
  },
});

/**
 * 发送验证码邮件
 */
export async function sendVerificationCode(
  toEmail: string,
  code: string
): Promise<boolean> {
  try {
    const mailOptions = {
      from: '"虾牢记" <428738807@qq.com>',
      to: toEmail,
      subject: '🦐 虾牢记 - 邮箱验证码',
      html: `
        <div style="max-width: 400px; margin: 0 auto; padding: 20px; font-family: Arial, sans-serif;">
          <div style="text-align: center; padding: 20px; background: linear-gradient(135deg, #FF6B6B, #FFB5B5); border-radius: 16px; margin-bottom: 20px;">
            <h1 style="color: white; margin: 0; font-size: 24px;">🦐 虾牢记</h1>
            <p style="color: white; margin: 8px 0 0 0; font-size: 14px;">邮箱验证码</p>
          </div>
          <div style="background: #F8F8F8; border-radius: 12px; padding: 20px; text-align: center;">
            <p style="color: #666666; font-size: 14px; margin-bottom: 16px;">您的验证码是：</p>
            <div style="background: white; border-radius: 8px; padding: 16px; margin-bottom: 16px;">
              <span style="font-size: 32px; font-weight: bold; color: #FF6B6B; letter-spacing: 8px;">${code}</span>
            </div>
            <p style="color: #999999; font-size: 12px; margin: 0;">验证码 5 分钟内有效，请勿泄露给他人</p>
          </div>
          <p style="text-align: center; color: #CCCCCC; font-size: 11px; margin-top: 20px;">如果这不是您的操作，请忽略此邮件</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    console.log(`Verification code sent to ${toEmail}`);
    return true;
  } catch (error) {
    console.error('Failed to send email:', error);
    return false;
  }
}
