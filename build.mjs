import { execSync } from 'node:child_process';
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

// `--clean` only removes the final build, without installing dependencies.
if (process.argv.includes('--clean')) {
  rmSync(dist, { recursive: true, force: true });
  console.log('clean over!');
} else {
  // On Windows these commands run through cmd.exe; on Unix they run through sh.
  // Both commands run in the project root, even if invoked from another directory.
  console.log('Installing dependencies...');
  execSync('npm install', { cwd: root, stdio: 'inherit' });

  console.log('Compiling TypeScript...');
  execSync('npx tsc -b', { cwd: root, stdio: 'inherit' });
  console.log('compile over!');

  const requiredDirs = ['src/dist', 'share/dist', 'ui/dist', 'public'];
  for (const dir of requiredDirs) {
    if (!existsSync(projectPath(dir))) {
      throw new Error(`Missing ${dir}. Check TypeScript output and project files.`);
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

  // Merge backend and frontend outputs.
  rmSync(dist, { recursive: true, force: true });
  copyJsFiles('src/dist', 'dist/src');
  copyJsFiles('share/dist', 'dist/share');
  cpSync(projectPath('public'), projectPath('dist/public'), { recursive: true });
  copyJsFiles('ui/dist', 'dist/public/ui');
  copyJsFiles('share/dist', 'dist/public/share');
  console.log('merge over!');

  // Remove intermediate compiler outputs.
  for (const dir of ['src/dist', 'ui/dist', 'share/dist']) {
    rmSync(projectPath(dir), { recursive: true, force: true });
  }
  console.log('clean over!');
}
