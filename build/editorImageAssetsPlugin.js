import { cpSync, createReadStream, existsSync, statSync } from 'node:fs';
import path from 'node:path';

const imageNamePattern = /^[a-f0-9]{64}\.gif$/;

export function editorImageAssetsPlugin({ sourceDirectory }) {
  return {
    name: 'editor-image-assets',
    configureServer(server) {
      server.middlewares.use('/editor_image', (request, response, next) => {
        const fileName = decodeURIComponent(request.url.split('?')[0]).replace(/^\/+/, '');
        if (!imageNamePattern.test(fileName)) return next();

        const filePath = path.join(sourceDirectory, fileName);
        if (!existsSync(filePath)) return next();

        const stats = statSync(filePath);
        response.statusCode = 200;
        response.setHeader('Content-Type', 'image/gif');
        response.setHeader('Content-Length', stats.size);
        response.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
        if (request.method === 'HEAD') return response.end();
        return createReadStream(filePath).pipe(response);
      });
    },
    writeBundle(options) {
      const outputDirectory = path.resolve(options.dir || 'dist');
      cpSync(sourceDirectory, path.join(outputDirectory, 'editor_image'), {
        recursive: true,
        filter: (source) => path.extname(source) !== '.json'
      });
    }
  };
}
