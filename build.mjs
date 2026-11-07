import {
  cpSync,
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
} from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(fileURLToPath(import.meta.url));
const projectPath = (...parts) => path.join(root, ...parts);
const dist = projectPath('dist');

if (process.argv.includes('--clean')) {
  rmSync(dist, { recursive: true, force: true });
  console.log('clean over!');
} else {
  // TypeScript has already been compiled by `tsc -b` in package.json.
  const requiredDirs = ['src/dist', 'share/dist', 'ui/dist', 'public'];
  for (const dir of requiredDirs) {
    if (!existsSync(projectPath(dir))) {
      throw new Error(`Missing ${dir}. Check your TypeScript build output and project files.`);
    }
  }

  function copyJsFiles(sourceDir, destinationDir) {
    const files = readdirSync(projectPath(sourceDir), { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.js'));

    if (files.length === 0) {
      throw new Error(`No .js files found in ${sourceDir}. Check tsconfig output paths.`);
    }

    mkdirSync(projectPath(destinationDir), { recursive: true });
    for (const file of files) {
      copyFileSync(projectPath(sourceDir, file.name), projectPath(destinationDir, file.name));
    }
  }

  // Merge backend and frontend files into dist/.
  rmSync(dist, { recursive: true, force: true });
  copyJsFiles('src/dist', 'dist/src');
  copyJsFiles('share/dist', 'dist/share');
  cpSync(projectPath('public'), projectPath('dist', 'public'), { recursive: true });
  copyJsFiles('ui/dist', 'dist/public/ui');
  copyJsFiles('share/dist', 'dist/public/share');
  console.log('merge over!');

  // Remove intermediate TypeScript build folders.
  for (const dir of ['src/dist', 'ui/dist', 'share/dist']) {
    rmSync(projectPath(dir), { recursive: true, force: true });
  }
  console.log('clean over!');
}
