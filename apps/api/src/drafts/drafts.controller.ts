import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { config } from '../config';
import { DraftsService } from './drafts.service';
import { AnalyticsService } from '../analytics/analytics.service';

@Controller('drafts')
export class DraftsController {
  constructor(
    private readonly drafts: DraftsService,
    private readonly analytics: AnalyticsService,
  ) {}

  @Post()
  async create(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const clientId =
      (req.cookies?.en_client as string | undefined) ??
      (req.headers['x-client-id'] as string | undefined);
    const draft = await this.drafts.create(clientId);
    res.cookie(config.draftCookieName, draft.token, {
      httpOnly: true,
      sameSite: 'lax',
      maxAge: 1000 * 60 * 60 * 24 * 30,
      path: '/',
    });
    await this.analytics.track({
      name: 'create_started',
      draftId: draft.id,
      clientId,
      path: '/criar',
    });
    return this.drafts.toPublic(await this.drafts.findByToken(draft.token));
  }

  @Get('me')
  async me(@Req() req: Request) {
    const token =
      (req.cookies?.[config.draftCookieName] as string | undefined) ??
      (req.headers['x-draft-token'] as string | undefined);
    if (!token) return { draft: null };
    try {
      const draft = await this.drafts.findByToken(token);
      return { draft: await this.drafts.toPublic(draft) };
    } catch {
      return { draft: null };
    }
  }

  @Get(':token')
  async get(@Param('token') token: string) {
    const draft = await this.drafts.findByToken(token);
    return this.drafts.toPublic(draft);
  }

  @Patch(':token')
  async patch(@Param('token') token: string, @Body() body: unknown) {
    const draft = await this.drafts.patch(token, body);
    const answers = (draft.memoriesAnswers as Record<string, string> | null) ?? {};
    if (draft.photoAKey && draft.photoBKey) {
      await this.analytics.track({
        name: 'photos_uploaded',
        draftId: draft.id,
      });
    }
    if (draft.styleId) {
      await this.analytics.track({
        name: 'style_chosen',
        draftId: draft.id,
        meta: { styleId: draft.styleId },
      });
    }
    if (Object.keys(answers).length >= 3) {
      await this.analytics.track({
        name: 'memories_done',
        draftId: draft.id,
      });
    }
    return this.drafts.toPublic(draft);
  }
}
