import { spawn } from 'node:child_process';

const processes = [
  {
    name: 'backend',
    command: 'npm',
    args: ['start'],
    cwd: 'backend',
  },
  {
    name: 'frontend',
    command: 'npm',
    args: ['run', 'dev'],
    cwd: 'frontend',
  },
];

let shuttingDown = false;

function prefixOutput(name, stream, chunk) {
  const lines = chunk.toString().split(/\r?\n/);

  for (const line of lines) {
    if (line) {
      stream.write(`[${name}] ${line}\n`);
    }
  }
}

const children = processes.map(({ name, command, args, cwd }) => {
  const child = spawn(command, args, {
    cwd,
    stdio: ['inherit', 'pipe', 'pipe'],
    shell: process.platform === 'win32',
  });

  child.stdout.on('data', (chunk) => prefixOutput(name, process.stdout, chunk));
  child.stderr.on('data', (chunk) => prefixOutput(name, process.stderr, chunk));

  child.on('exit', (code, signal) => {
    if (!shuttingDown) {
      shuttingDown = true;
      console.error(`[dev] ${name} stopped (${signal || `exit ${code}`}). Stopping the other process...`);
      stopChildren();
      process.exit(code || 1);
    }
  });

  return child;
});

function stopChildren() {
  for (const child of children) {
    if (!child.killed) {
      child.kill('SIGTERM');
    }
  }
}

process.on('SIGINT', () => {
  shuttingDown = true;
  stopChildren();
  process.exit(130);
});

process.on('SIGTERM', () => {
  shuttingDown = true;
  stopChildren();
  process.exit(143);
});
