import { Resend } from 'resend';

let connectionSettings: any;

async function getCredentials() {
  const hostname = process.env.REPLIT_CONNECTORS_HOSTNAME;
  const xReplitToken = process.env.REPL_IDENTITY 
    ? 'repl ' + process.env.REPL_IDENTITY 
    : process.env.WEB_REPL_RENEWAL 
    ? 'depl ' + process.env.WEB_REPL_RENEWAL 
    : null;

  if (!xReplitToken) {
    throw new Error('X_REPLIT_TOKEN not found for repl/depl');
  }

  connectionSettings = await fetch(
    'https://' + hostname + '/api/v2/connection?include_secrets=true&connector_names=resend',
    {
      headers: {
        'Accept': 'application/json',
        'X_REPLIT_TOKEN': xReplitToken
      }
    }
  ).then(res => res.json()).then(data => data.items?.[0]);

  if (!connectionSettings || (!connectionSettings.settings.api_key)) {
    throw new Error('Resend not connected');
  }
  return {apiKey: connectionSettings.settings.api_key, fromEmail: connectionSettings.settings.from_email};
}

export async function getUncachableResendClient() {
  const credentials = await getCredentials();
  return {
    client: new Resend(credentials.apiKey),
    fromEmail: connectionSettings.settings.from_email
  };
}

export async function sendPasswordResetEmail(to: string, resetToken: string, username: string) {
  const { client, fromEmail } = await getUncachableResendClient();
  
  const resetUrl = `${process.env.REPLIT_DOMAINS?.split(',')[0] || 'http://localhost:5000'}/reset-password?token=${resetToken}`;
  
  const { data, error } = await client.emails.send({
    from: fromEmail,
    to: [to],
    subject: 'Reset Your Finance Tracker Password',
    html: `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .container {
              background-color: #f9fafb;
              border-radius: 8px;
              padding: 30px;
              margin: 20px 0;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              font-size: 24px;
              font-weight: bold;
              color: #2563eb;
              margin-bottom: 10px;
            }
            .button {
              display: inline-block;
              background-color: #2563eb;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
              font-weight: 500;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              font-size: 14px;
              color: #6b7280;
            }
            .warning {
              background-color: #fef3c7;
              border-left: 4px solid #f59e0b;
              padding: 12px;
              margin: 20px 0;
              border-radius: 4px;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="logo">📈 Finance Tracker</div>
              <h1 style="margin: 0; font-size: 24px;">Password Reset Request</h1>
            </div>
            
            <p>Hi <strong>${username}</strong>,</p>
            
            <p>We received a request to reset your password for your Finance Tracker account.</p>
            
            <p style="text-align: center;">
              <a href="${resetUrl}" class="button">Reset Your Password</a>
            </p>
            
            <div class="warning">
              <strong>⏰ This link expires in 1 hour</strong>
            </div>
            
            <p>If the button doesn't work, copy and paste this link into your browser:</p>
            <p style="word-break: break-all; background-color: #f3f4f6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 12px;">
              ${resetUrl}
            </p>
            
            <div class="footer">
              <p><strong>Didn't request this?</strong></p>
              <p>If you didn't request a password reset, you can safely ignore this email. Your password will remain unchanged.</p>
              <p style="margin-top: 20px;">
                Best regards,<br>
                The Finance Tracker Team
              </p>
            </div>
          </div>
        </body>
      </html>
    `,
  });

  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }

  return data;
}
