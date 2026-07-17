const fs = require('fs');
const path = require('path');
const nextDir = path.join('C:/Users/uc/Desktop/crypto-demo-platform/.next');

function search(dir) {
  let results = [];
  try {
    const items = fs.readdirSync(dir);
    for (const item of items) {
      const fullPath = path.join(dir, item);
      const stat = fs.statSync(fullPath);
      if (stat.isDirectory()) {
        results = results.concat(search(fullPath));
      } else if (stat.isFile()) {
        if (stat.size > 0 && stat.size < 50000000) { // Up to 50MB
           const content = fs.readFileSync(fullPath, 'utf8');
           if (content.includes('AdminDashboard') || content.includes('super admin')) {
              // Extract tab names
              const matches = content.match(/setActiveTab\(['"]([^'"]+)['"]\)/g);
              if (matches) {
                 const uniqueTabs = [...new Set(matches.map(m => m.replace(/setActiveTab\(['"]|['"]\)/g, '')))];
                 results.push({ path: fullPath, tabs: uniqueTabs, size: stat.size, mtime: stat.mtimeMs });
              }
           }
        }
      }
    }
  } catch(e) {}
  return results;
}

const found = search(nextDir);
const unique = {};
found.forEach(f => {
  const t = f.tabs.join(',');
  if (!unique[t] || f.mtime > unique[t].mtime) {
     unique[t] = f;
  }
});
console.log(Object.values(unique).map(u => ({ path: u.path, tabs: u.tabs, mtime: new Date(u.mtime).toISOString() })));
