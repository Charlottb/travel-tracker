import { spawn } from 'node:child_process';

const frontendUrl = 'http://localhost:3000/login';
const backendUrl = 'http://localhost:3003/api/auth/me';

function run(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      stdio: 'inherit',
      shell: process.platform === 'win32',
      ...options,
    });

    child.on('exit', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${command} ${args.join(' ')} failed with exit code ${code}`));
      }
    });
  });
}

async function waitForUrl(url, acceptedStatuses = [200], timeoutMs = 30000) {
  const start = Date.now();

  while (Date.now() - start < timeoutMs) {
    try {
      const response = await fetch(url, { method: 'GET' });

      if (acceptedStatuses.includes(response.status)) {
        return;
      }
    } catch (_error) {
      // Keep waiting until the dev servers are ready.
    }

    await new Promise((resolve) => setTimeout(resolve, 500));
  }

  throw new Error(`Timed out waiting for ${url}`);
}

const devServer = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  shell: process.platform === 'win32',
});

try {
  await waitForUrl(frontendUrl, [200]);
  await waitForUrl(backendUrl, [401]);
  await run('npm', ['--prefix', 'frontend', 'run', 'cy:run']);
} finally {
  devServer.kill('SIGTERM');
}
