const fs = require('fs');
let content = fs.readFileSync('C:/Users/uc/Desktop/crypto-demo-platform/perfect_dashboard_source.tsx', 'utf8');
const chunks = JSON.parse(fs.readFileSync('C:/Users/uc/Desktop/crypto-demo-platform/patch_chunks.json', 'utf8'));

for (const chunk of chunks) {
  content = content.replace(chunk.TargetContent, chunk.ReplacementContent);
}

fs.writeFileSync('C:/Users/uc/Desktop/crypto-demo-platform/src/app/admin/page.tsx', content, 'utf8');
console.log('Restored perfect dashboard and applied patches to src/app/admin/page.tsx');
