const fs = require('fs');

// Read the raw string
let rawContent = fs.readFileSync('C:/Users/uc/Desktop/crypto-demo-platform/restored_6_modules.tsx', 'utf8');

// The string might have literal \n and wrapping quotes because it was JSON.stringified twice.
let parsedContent = rawContent;
try {
  if (rawContent.startsWith('"') && rawContent.endsWith('"')) {
    parsedContent = JSON.parse(rawContent);
  }
} catch(e) {}

const chunks = JSON.parse(fs.readFileSync('C:/Users/uc/Desktop/crypto-demo-platform/patch_chunks.json', 'utf8'));

for (const chunk of chunks) {
  parsedContent = parsedContent.replace(chunk.TargetContent, chunk.ReplacementContent);
}

fs.writeFileSync('C:/Users/uc/Desktop/crypto-demo-platform/src/app/admin/page.tsx', parsedContent, 'utf8');
console.log('Fixed syntax error and applied patches!');
