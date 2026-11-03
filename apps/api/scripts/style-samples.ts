/**
 * Draws one sample scene per style for the style cards in the funnel, with a
 * couple described in text only (no customer photos).
 *
 *   pnpm --filter @entre-nos/api exec tsx scripts/style-samples.ts [styleId...]
 *
 * Needs OPENAI_API_KEY (or IMAGE_PROVIDER_API_KEY). Writes apps/web/public/styles/{id}.jpg.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { STYLE_IDS, type StyleId } from '@entre-nos/shared';
import { config } from '../src/config';
import { toPagePortrait } from '../src/generation/scene-images';
import { stylePack } from '../src/generation/style-packs';

const SCENE = [
  'A Brazilian couple in their early thirties: she has dark curly shoulder-length hair and warm brown skin;',
  'he has short black hair, a trimmed beard and light brown skin.',
  'They have just met again at a small neighborhood samba bar at night, string lights overhead,',
  'she is arriving through the crowd laughing, he is standing up from a sidewalk table, surprised.',
  'Medium shot, both caught mid-action, not posing.',
  'The top 30% of the image is calm night sky and string lights with no faces, reserved for text.',
  'Full-bleed portrait. Absolutely no text, letters, logos or watermarks.',
].join(' ');

async function main() {
  const key = config.openaiApiKey || config.imageProviderApiKey;
  if (!key) throw new Error('Defina OPENAI_API_KEY para gerar os exemplos.');
  const asked = process.argv.slice(2);
  const styles = (asked.length ? asked : STYLE_IDS).filter((id): id is StyleId =>
    (STYLE_IDS as readonly string[]).includes(id),
  );
  const out = resolve(__dirname, '../../web/public/styles');
  mkdirSync(out, { recursive: true });

  for (const styleId of styles) {
    const pack = stylePack(styleId);
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        model: config.imageModel,
        prompt: `${pack.positive}\n${SCENE}\nAvoid: ${pack.negative}.`,
        size: '1024x1536',
        quality: 'medium',
        output_format: 'jpeg',
      }),
      signal: AbortSignal.timeout(180_000),
    });
    const payload = (await response.json()) as { error?: { message?: string }; data?: { b64_json?: string }[] };
    const b64 = payload.data?.[0]?.b64_json;
    if (!response.ok || !b64) {
      throw new Error(`${styleId}: ${payload.error?.message ?? `falhou (${response.status})`}`);
    }
    const file = resolve(out, `${styleId}.jpg`);
    writeFileSync(file, await toPagePortrait(Buffer.from(b64, 'base64')));
    console.log(`${styleId} → ${file}`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
