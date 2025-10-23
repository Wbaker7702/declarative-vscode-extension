import { fileURLToPath } from 'node:url';
import path from 'node:path';
import fs from 'node:fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, '..');

const pkgJsonPath = path.join(repoRoot, 'package.json');
const siteDir = path.join(repoRoot, 'site');
const indexHtmlPath = path.join(siteDir, 'index.html');

function main() {
  if (!fs.existsSync(pkgJsonPath)) {
    throw new Error(`package.json not found at ${pkgJsonPath}`);
  }
  if (!fs.existsSync(siteDir)) {
    throw new Error(`site directory not found at ${siteDir}`);
  }

  const pkg = JSON.parse(fs.readFileSync(pkgJsonPath, 'utf8'));
  const version = pkg.version;
  if (!version) {
    throw new Error('Version not found in package.json');
  }

  const vsixName = `declarative-gradle-support-${version}.vsix`;
  const vsixSource = path.join(repoRoot, vsixName);
  if (!fs.existsSync(vsixSource)) {
    throw new Error(`VSIX not found at ${vsixSource}. Run vsce package first.`);
  }

  const vsixDest = path.join(siteDir, vsixName);
  fs.copyFileSync(vsixSource, vsixDest);
  console.log(`Copied ${vsixSource} -> ${vsixDest}`);

  if (fs.existsSync(indexHtmlPath)) {
    const original = fs.readFileSync(indexHtmlPath, 'utf8');
    let updated = original;
    // Replace placeholder-based link if present
    updated = updated.replace(
      'declarative-gradle-support-{{SHORT_SHA}}.vsix',
      vsixName
    );
    // If an older .vsix is present in href, update it to the new version
    updated = updated.replace(
      /declarative-gradle-support-[^"']+\.vsix/g,
      vsixName
    );

    if (updated !== original) {
      fs.writeFileSync(indexHtmlPath, updated, 'utf8');
      console.log(`Updated download link in ${indexHtmlPath} -> ${vsixName}`);
    } else {
      console.log(`No changes needed in ${indexHtmlPath}`);
    }
  } else {
    console.warn(`index.html not found at ${indexHtmlPath}; skipped link update.`);
  }
}

main();
