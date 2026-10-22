import { readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const materialPath = path.join(projectRoot, 'src/assets/editor_material.json');
const manifestPath = path.join(projectRoot, 'src/assets/editor_image/manifest.json');
const temporaryPath = `${materialPath}.tmp`;
const restoreRemoteUrls = process.argv.includes('--restore');

function normalizeRemoteUrl(value) {
  const decoded = value.trim()
    .replace(/^(?:&quot;|&#34;|&#39;)+|(?:&quot;|&#34;|&#39;)+$/gi, '')
    .replaceAll('&amp;', '&');
  if (decoded.startsWith('//')) return `https:${decoded}`;
  if (/^https?:\/\//i.test(decoded)) return decoded.replace(/^http:\/\//i, 'https://');
  return null;
}

function replaceImageReferences(content, remoteToLocal, localToRemote, changedUrls) {
  const replaceValue = (value) => {
    if (restoreRemoteUrls) {
      const remote = localToRemote.get(value);
      if (remote) changedUrls.add(remote);
      return remote || value;
    }

    const normalized = normalizeRemoteUrl(value);
    const local = normalized ? remoteToLocal.get(normalized) : null;
    if (local) changedUrls.add(normalized);
    return local || value;
  };

  return content
    .replace(/((?:src|data-src|href|xlink:href)\s*=\s*["'])(.*?)(["'])/gi, (match, before, value, after) => {
      return `${before}${replaceValue(value)}${after}`;
    })
    .replace(/(url\(\s*["']?)(.*?)(["']?\s*\))/gi, (match, before, value, after) => {
      return `${before}${replaceValue(value)}${after}`;
    })
    .replace(/(?:https?:)?\/\/(?:mpcdn\.wxeditor\.com|acdn\.wxeditor\.com|mmbiz\.qlogo\.cn)\/[^\s"'<>)]*/gi, (value) => {
      return replaceValue(value);
    });
}

async function main() {
  const [materials, manifest] = await Promise.all([
    readFile(materialPath, 'utf8').then(JSON.parse),
    readFile(manifestPath, 'utf8').then(JSON.parse)
  ]);

  if (manifest.failed || manifest.entries.length !== manifest.total) {
    throw new Error('Image manifest is incomplete; refusing to rewrite material data.');
  }

  const remoteToLocal = new Map();
  const localToRemote = new Map();
  for (const entry of manifest.entries) {
    const local = `./editor_image/${entry.file}`;
    remoteToLocal.set(entry.url, local);
    localToRemote.set(local, entry.url);
  }

  const changedUrls = new Set();
  let changedMaterials = 0;
  for (const material of materials) {
    const content = String(material.content || '');
    const replaced = replaceImageReferences(content, remoteToLocal, localToRemote, changedUrls);
    if (replaced !== content) {
      material.content = replaced;
      changedMaterials += 1;
    }
  }

  await writeFile(temporaryPath, `${JSON.stringify(materials, null, 2)}\n`);
  await rm(materialPath);
  await rename(temporaryPath, materialPath);
  console.log(JSON.stringify({
    mode: restoreRemoteUrls ? 'restore' : 'localize',
    changedMaterials,
    changedUniqueUrls: changedUrls.size,
    manifestImages: manifest.total
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
