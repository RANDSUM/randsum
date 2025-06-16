#!/usr/bin/env bun

/**
 * Simple static file server for serving documentation
 * Built with Bun's native server capabilities
 */

import { file } from 'bun';
import { join, extname } from 'path';

const PORT = process.env.PORT ? parseInt(process.env.PORT) : 8000;
const DOCS_DIR = join(import.meta.dir, '..', 'docs');

// MIME type mapping
const MIME_TYPES: Record<string, string> = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.eot': 'application/vnd.ms-fontobject',
  '.txt': 'text/plain',
  '.md': 'text/markdown',
};

function getMimeType(filePath: string): string {
  const ext = extname(filePath).toLowerCase();
  return MIME_TYPES[ext] || 'application/octet-stream';
}

async function serveFile(filePath: string): Promise<Response> {
  try {
    const fileObj = file(filePath);
    const exists = await fileObj.exists();
    
    if (!exists) {
      return new Response('404 Not Found', { 
        status: 404,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const mimeType = getMimeType(filePath);
    const fileContent = await fileObj.arrayBuffer();
    
    return new Response(fileContent, {
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new Response('500 Internal Server Error', { 
      status: 500,
      headers: { 'Content-Type': 'text/plain' }
    });
  }
}

const server = Bun.serve({
  port: PORT,
  async fetch(req) {
    const url = new URL(req.url);
    let pathname = url.pathname;

    // Remove leading slash and resolve relative to docs directory
    if (pathname === '/') {
      pathname = '/index.html';
    }

    // Security: prevent directory traversal
    if (pathname.includes('..')) {
      return new Response('400 Bad Request', { 
        status: 400,
        headers: { 'Content-Type': 'text/plain' }
      });
    }

    const filePath = join(DOCS_DIR, pathname.slice(1));
    
    // If it's a directory, try to serve index.html
    try {
      const stat = await Bun.file(filePath).exists();
      if (!stat) {
        // Try with .html extension for clean URLs
        const htmlPath = filePath + '.html';
        const htmlExists = await Bun.file(htmlPath).exists();
        if (htmlExists) {
          return serveFile(htmlPath);
        }
        
        // Try index.html in directory
        const indexPath = join(filePath, 'index.html');
        const indexExists = await Bun.file(indexPath).exists();
        if (indexExists) {
          return serveFile(indexPath);
        }
      }
    } catch (error) {
      // File doesn't exist, continue to serve the original path
    }

    return serveFile(filePath);
  },
});

console.log(`📚 Documentation server running at http://localhost:${PORT}`);
console.log(`📁 Serving files from: ${DOCS_DIR}`);
console.log('🔗 API Documentation: http://localhost:8000/api/generated/');
console.log('⏹️  Press Ctrl+C to stop');
