import { Injectable } from '@nestjs/common';
import { MailService } from '../mail/mail.service';

@Injectable()
export class EmailService {
  constructor(private readonly mail: MailService) {}

  sendBookReady(input: {
    to: string;
    manageUrl: string;
    giftUrl: string;
    names: string;
    coverKey?: string | null;
  }) {
    return this.mail.sendBookReady(input);
  }
}
