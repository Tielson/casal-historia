import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../apps/api');
const run = (cmd, args, opts = {}) =>
  spawn(cmd, args, { cwd: root, stdio: 'inherit', shell: true, ...opts });

// Ensure Prisma Client types exist before tsc (fresh Windows checkouts often skip generate).
const generate = run('pnpm', ['exec', 'prisma', 'generate']);
generate.on('exit', (genCode) => {
  if (genCode !== 0) process.exit(genCode ?? 1);
  const build = run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json']);
  build.on('exit', (code) => {
    if (code !== 0) process.exit(code ?? 1);
    run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput']);
    run('node', ['--watch', 'dist/main.js']);
  });
});
