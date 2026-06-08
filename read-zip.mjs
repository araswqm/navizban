import { createReadStream } from 'fs';
import { unzip, createUnzip } from 'zlib';
import { pipeline } from 'stream';
import { promisify } from 'util';
import { execSync } from 'child_process';

// Try using unzip command via child_process
try {
  const result = execSync('unzip -l "Replit Navizban-Clone.zip" 2>&1', { 
    cwd: '/workspaces/navizban',
    maxBuffer: 1024 * 1024 
  });
  console.log(result.toString());
} catch(e) {
  console.error('Error:', e.message);
}

// Also try to extract specific files
const files = [
  'Navizban-Clone/package.json',
  'Navizban-Clone/artifacts/mobile/package.json',
  'Navizban-Clone/artifacts/mobile/app.json',
  'Navizban-Clone/artifacts/mobile/eas.json',
  'Navizban-Clone/artifacts/mobile/tsconfig.json',
  'Navizban-Clone/artifacts/mobile/app/_layout.tsx',
  'Navizban-Clone/artifacts/mobile/app/(tabs)/index.tsx',
  'Navizban-Clone/artifacts/mobile/context/NavizbanContext.tsx',
  'Navizban-Clone/artifacts/mobile/context/ThemeContext.tsx',
  'Navizban-Clone/artifacts/mobile/constants/izban.ts',
  'Navizban-Clone/artifacts/mobile/constants/route.ts',
  'Navizban-Clone/artifacts/mobile/services/trainTelemetry.ts',
  'Navizban-Clone/artifacts/api-server/package.json',
  'Navizban-Clone/artifacts/api-server/src/app.ts',
  'Navizban-Clone/artifacts/api-server/src/index.ts',
  'Navizban-Clone/artifacts/api-server/src/routes/index.ts',
  'Navizban-Clone/artifacts/api-server/src/routes/trains.ts',
  'Navizban-Clone/artifacts/api-server/src/routes/health.ts',
  'Navizban-Clone/lib/navizban-core/package.json',
  'Navizban-Clone/lib/navizban-core/src/index.ts',
  'Navizban-Clone/pnpm-workspace.yaml',
  'Navizban-Clone/tsconfig.base.json',
  'Navizban-Clone/tsconfig.json',
  'Navizban-Clone/artifacts/mobile/server/serve.js',
  'Navizban-Clone/artifacts/mobile/server/templates/landing-page.html'
];

for (const file of files) {
  try {
    const cmd = `unzip -p "Replit Navizban-Clone.zip" "${file}" 2>&1`;
    console.log(`\n\n===== ${file} =====`);
    const result = execSync(cmd, { 
      cwd: '/workspaces/navizban',
      maxBuffer: 1024 * 1024 
    });
    console.log(result.toString());
  } catch(e) {
    console.error(`Error reading ${file}: ${e.message.substring(0, 200)}`);
  }
}
