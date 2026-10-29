import { type Manuscript } from '@entre-nos/shared';
import { config } from '../config';
import { type AuthorInput } from './local-author';
import { writeManuscriptWith } from './manuscript-author';

export async function authorWithOpenAI(input: AuthorInput): Promise<Manuscript> {
  if (!config.openaiApiKey) {
    throw new Error('Geração de texto indisponível: falta OPENAI_API_KEY.');
  }
  return writeManuscriptWith(input, complete);
}

async function complete(system: string, user: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      authorization: `Bearer ${config.openaiApiKey}`,
    },
    body: JSON.stringify({
      model: config.openaiTextModel,
      max_completion_tokens: 16000,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system },
        { role: 'user', content: user },
      ],
    }),
    signal: AbortSignal.timeout(180_000),
  });
  const payload = (await response.json()) as {
    error?: { message?: string };
    choices?: { finish_reason?: string; message?: { content?: string | null; refusal?: string | null } }[];
  };
  if (!response.ok) {
    throw new Error(payload.error?.message ?? `ChatGPT recusou a história (${response.status}).`);
  }
  const choice = payload.choices?.[0];
  if (choice?.message?.refusal) {
    throw new Error(choice.message.refusal);
  }
  const text = choice?.message?.content?.trim();
  if (!text) {
    throw new Error(
      choice?.finish_reason === 'length'
        ? 'ChatGPT cortou a história antes de terminar.'
        : 'ChatGPT devolveu uma história vazia.',
    );
  }
  return text;
}
