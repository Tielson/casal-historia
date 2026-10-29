import { spawn } from 'node:child_process';
import { createRequire } from 'node:module';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '../apps/api');
const require = createRequire(join(root, 'package.json'));

const quote = (value) => (/[\s"]/.test(value) ? `"${value.replaceAll('"', '\\"')}"` : value);

// One shell command string avoids Node's DEP0190 (args + shell:true).
const run = (cmd, args, { capture = false } = {}) => {
  if (process.platform === 'win32') {
    return spawn([cmd, ...args.map(quote)].join(' '), {
      cwd: root,
      stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
      shell: true,
    });
  }
  return spawn(cmd, args, {
    cwd: root,
    stdio: capture ? ['inherit', 'pipe', 'pipe'] : 'inherit',
  });
};

const enginePresent = () => {
  try {
    const clientDir = dirname(require.resolve('@prisma/client'));
    const generated = join(clientDir, '..', '.prisma', 'client');
    const engineName =
      process.platform === 'win32'
        ? 'query_engine-windows.dll.node'
        : 'libquery_engine';
    return (
      existsSync(join(generated, 'index.js')) &&
      (process.platform === 'win32'
        ? existsSync(join(generated, engineName))
        : true)
    );
  } catch {
    return false;
  }
};

const exitCode = (child) =>
  new Promise((resolve) => {
    let output = '';
    child.stdout?.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stdout.write(text);
    });
    child.stderr?.on('data', (chunk) => {
      const text = chunk.toString();
      output += text;
      process.stderr.write(text);
    });
    child.on('exit', (code) => resolve({ code: code ?? 1, output }));
  });

// Fresh checkouts often skip generate. Re-running it on Windows fails with EPERM
// when a previous API still has query_engine-windows.dll.node loaded.
const generate = await exitCode(run('pnpm', ['exec', 'prisma', 'generate'], { capture: true }));
if (generate.code !== 0) {
  const locked = generate.output.includes('EPERM') && enginePresent();
  if (!locked) process.exit(generate.code);
  console.warn(
    '\nPrisma could not replace query_engine-windows.dll.node because another process has it open. Dev will use the client already generated. Stop that API and run prisma generate again after a schema change.\n',
  );
}

const build = await exitCode(run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json']));
if (build.code !== 0) process.exit(build.code);

run('pnpm', ['exec', 'tsc', '-p', 'tsconfig.json', '--watch', '--preserveWatchOutput']);
run('node', ['--watch', 'dist/main.js']);
