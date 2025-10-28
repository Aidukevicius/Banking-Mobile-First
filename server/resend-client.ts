
import * as brevo from '@getbrevo/brevo';

let apiInstance: brevo.TransactionalEmailsApi | null = null;

function getApiInstance() {
  if (!apiInstance) {
    apiInstance = new brevo.TransactionalEmailsApi();
    apiInstance.setApiKey(
      brevo.TransactionalEmailsApiApiKeys.apiKey,
      process.env.BREVO_API_KEY!
    );
  }
  return apiInstance;
}

export async function sendPasswordResetEmail(to: string, resetToken: string, username: string) {
  const api = getApiInstance();
  
  const resetUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const fromEmail = process.env.FROM_EMAIL || 'dom.aidukevicius@gmail.com';
  const fromName = process.env.FROM_NAME || 'Finance Tracker';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body {
            font-family: Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #1e293b;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f8fafc;
          }
          .email-wrapper {
            background: white;
            border-radius: 12px;
            overflow: hidden;
            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          }
          .header {
            background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
            padding: 40px 30px;
            text-align: center;
          }
          .logo {
            font-size: 48px;
            margin-bottom: 12px;
          }
          .header-title {
            color: white;
            font-size: 24px;
            font-weight: 700;
            margin: 0;
            letter-spacing: -0.5px;
          }
          .content {
            padding: 40px 30px;
          }
          .greeting {
            font-size: 18px;
            font-weight: 600;
            color: #0f172a;
            margin-bottom: 20px;
          }
          .message {
            color: #475569;
            font-size: 15px;
            line-height: 1.7;
            margin-bottom: 30px;
          }
          .button-container {
            text-align: center;
            margin: 35px 0;
          }
          .button {
            display: inline-block;
            background: linear-gradient(135deg, #1e40af 0%, #2563eb 100%);
            color: white;
            padding: 16px 40px;
            text-decoration: none;
            border-radius: 8px;
            font-weight: 600;
            font-size: 16px;
            box-shadow: 0 4px 14px 0 rgba(37, 99, 235, 0.39);
            transition: transform 0.2s;
          }
          .button:hover {
            transform: translateY(-2px);
          }
          .info-box {
            background-color: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 16px;
            margin: 25px 0;
            border-radius: 6px;
          }
          .info-box p {
            margin: 0;
            color: #92400e;
            font-size: 14px;
            font-weight: 500;
          }
          .link-box {
            background-color: #f1f5f9;
            padding: 16px;
            border-radius: 8px;
            margin: 25px 0;
          }
          .link-box p {
            margin: 0 0 8px 0;
            color: #64748b;
            font-size: 13px;
          }
          .link-text {
            word-break: break-all;
            color: #2563eb;
            font-family: 'SF Mono', Monaco, monospace;
            font-size: 12px;
            margin: 0;
          }
          .footer {
            background-color: #f8fafc;
            padding: 30px;
            border-top: 1px solid #e2e8f0;
          }
          .footer-title {
            font-weight: 600;
            color: #0f172a;
            margin: 0 0 8px 0;
            font-size: 14px;
          }
          .footer-text {
            color: #64748b;
            font-size: 14px;
            line-height: 1.6;
            margin: 0 0 16px 0;
          }
          .footer-signature {
            color: #475569;
            font-size: 14px;
            margin: 20px 0 0 0;
          }
        </style>
      </head>
      <body>
        <div class="email-wrapper">
          <div class="header">
            <div class="logo">📈</div>
            <h1 class="header-title">Password Reset</h1>
          </div>
          
          <div class="content">
            <p class="greeting">Hi ${username}! 👋</p>
            
            <p class="message">
              We received a request to reset your password for your Finance Tracker account. 
              Click the button below to create a new password.
            </p>
            
            <div class="button-container">
              <a href="${resetUrl}" class="button">Reset Password</a>
            </div>
            
            <div class="info-box">
              <p>⏰ This secure link expires in 1 hour</p>
            </div>
            
            <div class="link-box">
              <p>If the button doesn't work, copy and paste this link:</p>
              <p class="link-text">${resetUrl}</p>
            </div>
          </div>
          
          <div class="footer">
            <p class="footer-title">Didn't request this?</p>
            <p class="footer-text">
              If you didn't request a password reset, you can safely ignore this email. 
              Your password will remain unchanged and your account is secure.
            </p>
            <p class="footer-signature">
              Best regards,<br>
              <strong>Finance Tracker Team</strong>
            </p>
          </div>
        </div>
      </body>
    </html>
  `;

  try {
    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.sender = { email: fromEmail, name: fromName };
    sendSmtpEmail.to = [{ email: to }];
    sendSmtpEmail.subject = 'Reset Your Finance Tracker Password';
    sendSmtpEmail.htmlContent = htmlContent;

    const result = await api.sendTransacEmail(sendSmtpEmail);
    console.log(`Email sent successfully via Brevo API: ${result.body.messageId}`);
    return { id: result.body.messageId };
  } catch (error: any) {
    console.error('Brevo API error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}
