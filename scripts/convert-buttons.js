const fs = require('fs').promises;
const path = require('path');

async function walk(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (full.includes(path.join('src', 'components', 'ui'))) continue; // skip ui components
      if (full.includes('node_modules')) continue;
      files.push(...(await walk(full)));
    } else if (entry.isFile() && (full.endsWith('.tsx') || full.endsWith('.jsx') || full.endsWith('.ts') || full.endsWith('.js'))) {
      files.push(full);
    }
  }
  return files;
}

function needsImport(content) {
  return /import\s+\{\s*Button\s*\}/.test(content) || /import\s+Button\s+from/.test(content);
}

async function processFile(file) {
  let content = await fs.readFile(file, 'utf8');
  if (!content.includes('<button') && !content.includes('</button>')) return false;

  // Skip files under src/components/ui explicitly
  if (file.includes(path.join('src', 'components', 'ui'))) return false;

  // Simple replace - may produce some edge cases but should be ok for most
  const newContent = content
    .replace(/<button\b/g, '<Button')
    .replace(/<\/button>/g, '</Button>');

  let final = newContent;
  if (!needsImport(final)) {
    // find last import position
    const importRegex = /^import .*;$/gm;
    let lastMatch;
    let match;
    while ((match = importRegex.exec(final)) !== null) lastMatch = match;
    const importLine = "import { Button } from '@/components/ui/button';\n";
    if (lastMatch) {
      const idx = lastMatch.index + lastMatch[0].length;
      final = final.slice(0, idx) + '\n' + importLine + final.slice(idx);
    } else {
      final = importLine + '\n' + final;
    }
  }

  if (final !== content) {
    await fs.writeFile(file, final, 'utf8');
    return true;
  }
  return false;
}

(async () => {
  const root = path.resolve(__dirname, '..');
  const src = path.join(root, 'src');
  console.log('Scanning', src);
  const files = await walk(src);
  console.log('Found files', files.length);
  let changed = 0;
  for (const f of files) {
    try {
      const ok = await processFile(f);
      if (ok) {
        console.log('Updated', f);
        changed++;
      }
    } catch (e) {
      console.error('Failed', f, e.message);
    }
  }
  console.log('Done. Files changed:', changed);
})();
