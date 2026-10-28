/**
 * List/create R2 bucket + put/head/get/delete smoke test.
 * Loads credentials from root /.env — never prints secret values.
 */
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  S3Client,
  ListBucketsCommand,
  CreateBucketCommand,
  HeadBucketCommand,
  PutObjectCommand,
  HeadObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');

function loadEnv(path) {
  const out = {};
  let raw = '';
  try {
    raw = readFileSync(path, 'utf8');
  } catch {
    return out;
  }
  for (const line of raw.split(/\r?\n/)) {
    const t = line.trim();
    if (!t || t.startsWith('#')) continue;
    const i = t.indexOf('=');
    if (i < 0) continue;
    const k = t.slice(0, i).trim();
    let v = t.slice(i + 1).trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[k] = v;
  }
  return out;
}

const env = { ...loadEnv(resolve(root, '.env')), ...loadEnv(resolve(root, 'apps/api/.env')) };

const accountId = env.CLOUDFLARE_ACCOUNT_ID || '098fe9248288b791e6a32e2a7622dbde';
const apiToken = env.CLOUDFLARE_API_TOKEN || '';
const endpoint = env.S3_ENDPOINT;
const region = env.S3_REGION || 'auto';
const accessKeyId = env.S3_ACCESS_KEY;
const secretAccessKey = env.S3_SECRET_KEY;
const preferredBucket = env.S3_BUCKET || 'nos-dois';
const forcePathStyle = (env.S3_FORCE_PATH_STYLE ?? 'true') === 'true';

function requireCred(name, value) {
  if (!value) {
    console.error(`FAIL: missing ${name}`);
    process.exit(1);
  }
}

requireCred('S3_ENDPOINT', endpoint);
requireCred('S3_ACCESS_KEY', accessKeyId);
requireCred('S3_SECRET_KEY', secretAccessKey);

const client = new S3Client({
  region,
  endpoint,
  forcePathStyle,
  credentials: { accessKeyId, secretAccessKey },
});

async function listViaCloudflareApi() {
  if (!apiToken) {
    console.log('CF API: skipped (no CLOUDFLARE_API_TOKEN)');
    return null;
  }
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${apiToken}` },
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok || body.success === false) {
    const err = body?.errors?.[0]?.message || res.statusText;
    console.log(`CF API list: FAIL (${res.status}) ${err}`);
    return null;
  }
  const names = (body.result?.buckets || []).map((b) => b.name);
  console.log(`CF API buckets: ${names.length ? names.join(', ') : '(none)'}`);
  return names;
}

async function createViaCloudflareApi(name) {
  if (!apiToken) return false;
  const url = `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ name }),
  });
  const body = await res.json().catch(() => ({}));
  if (res.ok && body.success !== false) {
    console.log(`CF API created bucket: ${name}`);
    return true;
  }
  const err = body?.errors?.[0]?.message || res.statusText;
  // 409 / already exists is fine
  if (/already exists|409/i.test(err) || res.status === 409) {
    console.log(`CF API bucket already exists: ${name}`);
    return true;
  }
  console.log(`CF API create: FAIL (${res.status}) ${err}`);
  return false;
}

async function listViaS3() {
  try {
    const out = await client.send(new ListBucketsCommand({}));
    const names = (out.Buckets || []).map((b) => b.Name).filter(Boolean);
    console.log(`S3 ListBuckets: ${names.length ? names.join(', ') : '(none)'}`);
    return names;
  } catch (err) {
    console.log(`S3 ListBuckets: FAIL (${err.name || 'Error'}) ${err.message}`);
    return null;
  }
}

async function ensureBucket(name) {
  try {
    await client.send(new HeadBucketCommand({ Bucket: name }));
    console.log(`HeadBucket OK: ${name}`);
    return true;
  } catch {
    console.log(`HeadBucket miss: ${name} — creating…`);
  }
  try {
    await client.send(new CreateBucketCommand({ Bucket: name }));
    console.log(`S3 CreateBucket OK: ${name}`);
    return true;
  } catch (err) {
    console.log(`S3 CreateBucket FAIL: ${err.message}`);
  }
  const cfOk = await createViaCloudflareApi(name);
  if (cfOk) {
    try {
      await client.send(new HeadBucketCommand({ Bucket: name }));
      console.log(`HeadBucket OK after CF create: ${name}`);
      return true;
    } catch (err) {
      console.log(`HeadBucket still FAIL: ${err.message}`);
    }
  }
  return false;
}

async function smoke(bucket) {
  const key = `smoke/r2-test-${Date.now()}.txt`;
  const body = Buffer.from('entre-nos r2 smoke ok\n', 'utf8');
  await client.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: 'text/plain',
    }),
  );
  console.log(`PutObject OK: ${key}`);

  const head = await client.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  console.log(`HeadObject OK: contentLength=${head.ContentLength}`);

  const got = await client.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
  const bytes = Buffer.from(await got.Body.transformToByteArray());
  if (bytes.toString('utf8') !== body.toString('utf8')) {
    throw new Error('GetObject body mismatch');
  }
  console.log(`GetObject OK: bytes=${bytes.length}`);

  await client.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  console.log(`DeleteObject OK: ${key}`);
  console.log('SMOKE: OK');
}

async function main() {
  console.log(`endpoint host: ${new URL(endpoint).host}`);
  console.log(`region=${region} forcePathStyle=${forcePathStyle}`);
  console.log(`preferred bucket: ${preferredBucket}`);

  const cfNames = await listViaCloudflareApi();
  const s3Names = await listViaS3();
  const existing = new Set([...(cfNames || []), ...(s3Names || [])]);

  const candidates = [preferredBucket, 'nos-dois', 'casal-historia', 'entre-nos'];
  let bucket =
    candidates.find((n) => existing.has(n)) ||
    preferredBucket;

  if (!existing.has(bucket)) {
    const ok = await ensureBucket(bucket);
    if (!ok) {
      console.error('FAIL: could not ensure bucket');
      process.exit(1);
    }
  } else {
    console.log(`Using existing bucket: ${bucket}`);
    await client.send(new HeadBucketCommand({ Bucket: bucket }));
    console.log(`HeadBucket OK: ${bucket}`);
  }

  await smoke(bucket);
  console.log(`BUCKET=${bucket}`);
}

main().catch((err) => {
  console.error(`FAIL: ${err.name || 'Error'}: ${err.message}`);
  process.exit(1);
});
