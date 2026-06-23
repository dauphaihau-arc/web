import { spawn } from 'node:child_process';
import { access, readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const rootDir = process.argv[2] ?? 'test-results';
const ffmpegPath = process.env.FFMPEG_BIN ?? 'ffmpeg';

async function pathExists(targetPath) {
  try {
    await access(targetPath);
    return true;
  }
  catch {
    return false;
  }
}

async function collectWebmFiles(targetPath) {
  const targetStat = await stat(targetPath);

  if (targetStat.isFile()) {
    return targetPath.endsWith('.webm') ? [targetPath] : [];
  }

  if (!targetStat.isDirectory()) {
    return [];
  }

  const entries = await readdir(targetPath, { withFileTypes: true });
  const files = await Promise.all(entries.map(async (entry) => {
    const entryPath = path.join(targetPath, entry.name);
    if (entry.isDirectory()) {
      return collectWebmFiles(entryPath);
    }

    return entry.name.endsWith('.webm') ? [entryPath] : [];
  }));

  return files.flat();
}

function convertToMp4(inputPath) {
  const outputPath = inputPath.replace(/\.webm$/i, '.mp4');

  return new Promise((resolve, reject) => {
    const child = spawn(
      ffmpegPath,
      [
        '-y',
        '-i',
        inputPath,
        '-c:v',
        'libx264',
        '-pix_fmt',
        'yuv420p',
        '-movflags',
        '+faststart',
        outputPath,
      ],
      {
        stdio: 'inherit',
      }
    );

    child.on('exit', (code) => {
      if (code === 0) {
        resolve(outputPath);
        return;
      }

      reject(new Error(`ffmpeg failed for ${inputPath} with exit code ${code ?? 'unknown'}`));
    });

    child.on('error', reject);
  });
}

async function main() {
  const exists = await pathExists(rootDir);

  if (!exists) {
    console.log(`No test results directory found at ${rootDir}`);
    return;
  }

  const webmFiles = await collectWebmFiles(rootDir);

  if (webmFiles.length === 0) {
    console.log(`No .webm files found under ${rootDir}`);
    return;
  }

  console.log(`Converting ${webmFiles.length} Playwright video(s) to .mp4...`);

  for (const webmFile of webmFiles) {
    await convertToMp4(webmFile);
  }

  console.log('MP4 conversion complete.');
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
