import { transporter } from '../config/email';
import { logger } from '@shopping-app/common';
import Handlebars from 'handlebars';
import { promises as fs } from 'fs';
import path from 'path';

interface EmailData {
  to: string;
  subject: string;
  html: string;
  metadata?: any;
}

export class EmailService {
  private readonly FROM_EMAIL = process.env.EMAIL_FROM || 'noreply@shopping-app.com';
  private readonly FROM_NAME = process.env.EMAIL_FROM_NAME || 'Shopping App';
  private templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();

  async sendEmail(data: EmailData) {
    try {
      const info = await transporter.sendMail({
        from: `"${this.FROM_NAME}" <${this.FROM_EMAIL}>`,
        to: data.to,
        subject: data.subject,
        html: data.html,
      });

      logger.info('Email sent successfully', {
        messageId: info.messageId,
        to: data.to,
      });

      return info;
    } catch (error: any) {
      logger.error('Failed to send email', {
        to: data.to,
        error: error.message,
      });
      throw error;
    }
  }

  async renderTemplate(templateName: string, data: any): Promise<string> {
    try {
      let template = this.templateCache.get(templateName);

      if (!template) {
        const templatePath = path.join(__dirname, '../templates', `${templateName}.hbs`);
        const templateContent = await fs.readFile(templatePath, 'utf-8');
        template = Handlebars.compile(templateContent);
        this.templateCache.set(templateName, template);
      }

      return template(data);
    } catch (error: any) {
      logger.error('Failed to render template', {
        templateName,
        error: error.message,
      });
      // Return simple HTML if template fails
      return this.generateFallbackTemplate(templateName, data);
    }
  }

  private generateFallbackTemplate(templateName: string, data: any): string {
    return `
      <html>
        <body style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>${templateName}</h2>
          <div style="margin: 20px 0;">
            <pre>${JSON.stringify(data, null, 2)}</pre>
          </div>
          <p>Best regards,<br>${this.FROM_NAME}</p>
        </body>
      </html>
    `;
  }
}
