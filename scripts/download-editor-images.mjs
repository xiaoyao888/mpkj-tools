import { createHash } from 'node:crypto';
import { mkdir, readFile, rename, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';

const projectRoot = path.resolve(import.meta.dirname, '..');
const materialPath = path.join(projectRoot, 'src/assets/editor_material.json');
const outputDirectory = path.join(projectRoot, 'src/assets/editor_image');
const manifestPath = path.join(outputDirectory, 'manifest.json');
const dryRun = process.argv.includes('--dry-run');
const concurrencyArgument = process.argv.find((argument) => argument.startsWith('--concurrency='));
const concurrency = Math.max(1, Number(concurrencyArgument?.split('=')[1]) || 6);

function normalizeUrl(value) {
  const decoded = value.trim()
    .replace(/^(?:&quot;|&#34;|&#39;)+|(?:&quot;|&#34;|&#39;)+$/gi, '')
    .replaceAll('&amp;', '&');
  if (decoded.startsWith('//')) return `https:${decoded}`;
  if (/^https?:\/\//i.test(decoded)) return decoded.replace(/^http:\/\//i, 'https://');
  return null;
}

function extractImageUrls(materials) {
  const references = new Map();
  const attributePattern = /(?:src|data-src|href|xlink:href)\s*=\s*(["'])(.*?)\1/gi;
  const cssUrlPattern = /url\(\s*(["']?)(.*?)\1\s*\)/gi;
  const cdnUrlPattern = /(?:https?:)?\/\/(?:mpcdn\.wxeditor\.com|acdn\.wxeditor\.com|mmbiz\.qlogo\.cn)\/[^\s"'<>)]*/gi;

  for (const material of materials) {
    const content = String(material.content || '');
    for (const pattern of [attributePattern, cssUrlPattern]) {
      pattern.lastIndex = 0;
      let match;
      while ((match = pattern.exec(content))) {
        const url = normalizeUrl(match[2]);
        if (!url) continue;
        if (!references.has(url)) references.set(url, new Set());
        references.get(url).add(Number(material.id));
      }
    }
    cdnUrlPattern.lastIndex = 0;
    let cdnMatch;
    while ((cdnMatch = cdnUrlPattern.exec(content))) {
      const url = normalizeUrl(cdnMatch[0]);
      if (!url) continue;
      if (!references.has(url)) references.set(url, new Set());
      references.get(url).add(Number(material.id));
    }
  }

  return references;
}

function getFileName(url) {
  return `${createHash('sha256').update(url).digest('hex')}.gif`;
}

function isGif(buffer) {
  const signature = buffer.subarray(0, 6).toString('ascii');
  return signature === 'GIF87a' || signature === 'GIF89a';
}

async function download(url, attempts = 3) {
  let lastError;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45_000);
    try {
      const response = await fetch(url, {
        headers: {
          Accept: 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8',
          'User-Agent': 'Mozilla/5.0 editor-material-downloader/1.0'
        },
        redirect: 'follow',
        signal: controller.signal
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const buffer = Buffer.from(await response.arrayBuffer());
      if (!buffer.length) throw new Error('empty response');
      return { buffer, contentType: response.headers.get('content-type') || '' };
    } catch (error) {
      lastError = error;
      if (attempt < attempts) await new Promise((resolve) => setTimeout(resolve, attempt * 750));
    } finally {
      clearTimeout(timeout);
    }
  }
  throw lastError;
}

async function main() {
  const materials = JSON.parse(await readFile(materialPath, 'utf8'));
  const references = extractImageUrls(materials);
  const urls = [...references.keys()].sort();
  let previousManifest = { entries: [], failures: [] };
  try {
    previousManifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  } catch {
    // The first run starts with an empty manifest.
  }
  const domains = {};
  for (const url of urls) {
    const hostname = new URL(url).hostname;
    domains[hostname] = (domains[hostname] || 0) + 1;
  }

  console.log(JSON.stringify({
    materials: materials.length,
    remoteImagesFound: urls.length,
    knownManifestImages: previousManifest.entries.length,
    domains
  }, null, 2));
  if (dryRun) return;

  const { default: sharp } = await import('sharp');
  await mkdir(outputDirectory, { recursive: true });
  const previousEntries = new Map(previousManifest.entries.map((entry) => [entry.url, entry]));
  const entries = new Array(urls.length);
  const failures = [];
  let cursor = 0;
  let completed = 0;
  let downloadedBytes = 0;
  let gifBytes = 0;

  async function worker() {
    while (cursor < urls.length) {
      const index = cursor;
      cursor += 1;
      const url = urls[index];
      const file = getFileName(url);
      const destination = path.join(outputDirectory, file);
      const temporary = `${destination}.tmp`;

      try {
        try {
          const existing = await readFile(destination);
          if (isGif(existing)) {
            const previous = previousEntries.get(url);
            entries[index] = previous || {
              url,
              file,
              materialIds: [...references.get(url)].sort((left, right) => left - right),
              contentType: 'image/gif',
              originalBytes: existing.length,
              gifBytes: existing.length
            };
            downloadedBytes += entries[index].originalBytes;
            gifBytes += existing.length;
            continue;
          }
        } catch {
          // Download missing or unreadable files again.
        }

        const { buffer, contentType } = await download(url);
        const output = isGif(buffer)
          ? buffer
          : await sharp(buffer, { animated: true, limitInputPixels: false })
            .gif({ effort: 2, colours: 256 })
            .toBuffer();

        await writeFile(temporary, output);
        await rename(temporary, destination);
        downloadedBytes += buffer.length;
        gifBytes += output.length;
        entries[index] = {
          url,
          file,
          materialIds: [...references.get(url)].sort((left, right) => left - right),
          contentType,
          originalBytes: buffer.length,
          gifBytes: output.length
        };
      } catch (error) {
        await rm(temporary, { force: true });
        failures.push({ url, error: error.message });
      } finally {
        completed += 1;
        if (completed % 50 === 0 || completed === urls.length) {
          console.log(`[${completed}/${urls.length}] failed=${failures.length}`);
        }
      }
    }
  }

  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  const mergedEntries = new Map(previousEntries);
  for (const entry of entries.filter(Boolean)) mergedEntries.set(entry.url, entry);
  const mergedFailures = [
    ...previousManifest.failures.filter((failure) => !mergedEntries.has(failure.url)),
    ...failures
  ];
  const allEntries = [...mergedEntries.values()].sort((left, right) => left.url.localeCompare(right.url));
  const manifest = {
    generatedAt: new Date().toISOString(),
    source: 'src/assets/editor_material.json',
    total: allEntries.length + mergedFailures.length,
    completed: allEntries.length,
    failed: mergedFailures.length,
    downloadedBytes: allEntries.reduce((sum, entry) => sum + entry.originalBytes, 0),
    gifBytes: allEntries.reduce((sum, entry) => sum + entry.gifBytes, 0),
    entries: allEntries,
    failures: mergedFailures
  };
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

  console.log(JSON.stringify({
    completed: manifest.completed,
    failed: manifest.failed,
    downloadedMiB: (manifest.downloadedBytes / 1024 / 1024).toFixed(2),
    gifMiB: (manifest.gifBytes / 1024 / 1024).toFixed(2),
    manifest: path.relative(projectRoot, manifestPath)
  }, null, 2));

  if (failures.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
