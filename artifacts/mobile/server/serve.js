/**
 * Navizban Web Sunucusu
 *
 * Expo web çıktısını serve eder veya landing page'i gösterir.
 * Kullanım: node server/serve.js [port]
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = parseInt(process.argv[2] || process.env.PORT || "3000");
const PUBLIC_DIR = path.join(__dirname, "..", "dist");
const TEMPLATES_DIR = path.join(__dirname, "templates");

function serveFile(res, filePath, contentType) {
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("Not Found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  let filePath = path.join(PUBLIC_DIR, url.pathname === "/" ? "index.html" : url.pathname);

  // Landing page
  if (url.pathname === "/" || url.pathname === "/landing") {
    filePath = path.join(TEMPLATES_DIR, "landing-page.html");
    serveFile(res, filePath, "text/html; charset=utf-8");
    return;
  }

  // Statik dosyalar
  const ext = path.extname(filePath);
  const mimeTypes = {
    ".html": "text/html; charset=utf-8",
    ".js": "application/javascript",
    ".css": "text/css",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".svg": "image/svg+xml",
    ".json": "application/json",
  };

  const contentType = mimeTypes[ext] || "application/octet-stream";
  serveFile(res, filePath, contentType);
});

server.listen(PORT, () => {
  console.log(`🌐 Navizban Web Sunucusu: http://localhost:${PORT}`);
  console.log(`📄 Landing Page: http://localhost:${PORT}/landing`);
});
