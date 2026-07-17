const fs = require('fs');
let content = fs.readFileSync('C:/Users/uc/Desktop/crypto-demo-platform/src/app/admin/page.tsx', 'utf8');

if (content.startsWith('"') && content.endsWith('"')) {
  try {
     content = JSON.parse(content);
  } catch(e) {
     console.error('JSON parse failed', e);
     // Try to manually unescape
     content = content.slice(1, -1).replace(/\\n/g, '\n').replace(/\\"/g, '"');
  }
}

fs.writeFileSync('C:/Users/uc/Desktop/crypto-demo-platform/src/app/admin/page.tsx', content, 'utf8');
console.log('Un-escaped successfully!');
