import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

const srcDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../src');

export async function resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('@/')) {
    const rel = specifier.slice(2);
    let full = path.join(srcDir, rel);
    if (!fs.existsSync(full)) {
      if (fs.existsSync(full + '.ts')) full = full + '.ts';
      else if (fs.existsSync(full + '.tsx')) full = full + '.tsx';
      else if (fs.existsSync(path.join(full, 'index.ts'))) full = path.join(full, 'index.ts');
      else if (fs.existsSync(path.join(full, 'index.tsx'))) full = path.join(full, 'index.tsx');
    }
    return nextResolve(pathToFileURL(full).href, context);
  }
  return nextResolve(specifier, context);
}
