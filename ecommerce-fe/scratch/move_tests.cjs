const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');
const destBase = path.join(__dirname, '../src/__tests__');

// Ensure destination exists
if (!fs.existsSync(destBase)) {
  fs.mkdirSync(destBase, { recursive: true });
}

function findTests(dir, fileList = []) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const filePath = path.join(dir, file);
    if (fs.statSync(filePath).isDirectory()) {
      if (filePath !== destBase) findTests(filePath, fileList);
    } else if (file.includes('.test.')) {
      fileList.push(filePath);
    }
  }
  return fileList;
}

const tests = findTests(srcDir);

for (const oldPath of tests) {
  const relPath = path.relative(srcDir, oldPath);
  const newRelPath = relPath.replace(/\\__tests__\\/g, '\\').replace(/\/__tests__\//g, '/');
  const newPath = path.join(destBase, newRelPath);
  
  fs.mkdirSync(path.dirname(newPath), { recursive: true });
  
  let content = fs.readFileSync(oldPath, 'utf8');
  
  // fix imports
  const importRegex = /from\s+['"]([^'"]+)['"]/g;
  content = content.replace(importRegex, (match, importPath) => {
    if (!importPath.startsWith('.')) return match; // skip non-relative
    
    const absImportedFile = path.resolve(path.dirname(oldPath), importPath);
    let newImportPath = path.relative(path.dirname(newPath), absImportedFile);
    
    // Convert backslash to forward slash for imports
    newImportPath = newImportPath.replace(/\\/g, '/');
    if (!newImportPath.startsWith('.')) newImportPath = './' + newImportPath;
    
    return `from '${newImportPath}'`;
  });
  
  fs.writeFileSync(newPath, content);
  fs.unlinkSync(oldPath); // delete old file
  
  console.log(`Moved: ${newRelPath}`);
}

console.log('Done!');
