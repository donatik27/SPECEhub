const fs = require('fs');
const path = require('path');

const appDir = path.resolve(__dirname, '..');
const repoRoot = path.resolve(appDir, '..', '..');
const sourceDir = path.join(repoRoot, 'node_modules', '.prisma', 'client');
const targetDir = path.join(appDir, '.prisma', 'client');

function copyPrismaEngines() {
  if (!fs.existsSync(sourceDir)) {
    console.error(`[prisma] Source not found: ${sourceDir}`);
    process.exit(1);
  }

  fs.rmSync(targetDir, { recursive: true, force: true });
  fs.mkdirSync(path.dirname(targetDir), { recursive: true });
  fs.cpSync(sourceDir, targetDir, { recursive: true });

  console.log(`[prisma] Copied engines to ${targetDir}`);
}

copyPrismaEngines();
