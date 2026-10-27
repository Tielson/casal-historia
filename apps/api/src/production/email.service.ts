import { Injectable, Logger } from '@nestjs/common';
import { config } from '../config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendBookReady(input: {
    to: string;
    manageUrl: string;
    giftUrl: string;
    names: string;
  }) {
    const subject = `Seu livro Entre Nós está pronto — ${input.names}`;
    const text = [
      `Olá! O livro digital de ${input.names} está pronto.`,
      ``,
      `Gerenciar / reler: ${input.manageUrl}`,
      `Link de presente (somente leitura): ${input.giftUrl}`,
      ``,
      `Com carinho,`,
      `Entre Nós`,
    ].join('\n');

    if (!config.resendApiKey) {
      this.logger.log(`[email stub] to=${input.to} subject=${subject}\n${text}`);
      return { ok: true, stub: true };
    }

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${config.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: config.emailFrom,
        to: [input.to],
        subject,
        text,
      }),
    });
    const json = await res.json().catch(() => ({}));
    return { ok: res.ok, stub: false, response: json };
  }
}
