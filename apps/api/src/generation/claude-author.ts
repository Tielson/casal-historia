import { type Manuscript } from '@entre-nos/shared';
import { config } from '../config';
import { type AuthorInput } from './local-author';
import { writeManuscriptWith } from './manuscript-author';

export async function authorWithClaude(input: AuthorInput): Promise<Manuscript> {
  if (!config.anthropicApiKey) {
    throw new Error('Geração de texto indisponível: falta ANTHROPIC_API_KEY.');
  }
  return writeManuscriptWith(input, complete);
}

async function complete(system: string, user: string): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': config.anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: config.anthropicModel,
      max_tokens: 8000,
      system,
      messages: [{ role: 'user', content: user }],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    content?: { type: string; text?: string }[];
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `Claude recusou a história (${response.status}).`);
  }
  const text = payload.content?.find((block) => block.type === 'text')?.text;
  if (!text) throw new Error('Claude devolveu uma história vazia.');
  return text;
}
