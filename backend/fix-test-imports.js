const fs = require('fs');
const path = require('path');

function fixImports(dir) {
  const files = fs.readdirSync(dir);
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixImports(filePath);
    } else if (file.endsWith('.test.ts')) {
      let content = fs.readFileSync(filePath, 'utf8');
      
      // Fix imports from current directory (./)
      content = content.replace(/from '\.\/([^']+)'/g, (match, p1) => {
        // Determine the correct path based on directory
        if (filePath.includes('test\\middleware') || filePath.includes('test/middleware')) {
          return `from '../../src/middleware/${p1}'`;
        } else if (filePath.includes('test\\routes') || filePath.includes('test/routes')) {
          return `from '../../src/routes/${p1}'`;
        } else if (filePath.includes('test\\services') || filePath.includes('test/services')) {
          return `from '../../src/services/${p1}'`;
        } else if (filePath.includes('test\\utils') || filePath.includes('test/utils')) {
          return `from '../../src/utils/${p1}'`;
        }
        return match;
      });
      
      // Fix imports from parent directory (../)
      content = content.replace(/from '\.\.\/([^']+)'/g, "from '../../src/$1'");
      
      // Fix jest.mock paths
      content = content.replace(/jest\.mock\('\.\/([^']+)'/g, (match, p1) => {
        if (filePath.includes('test\\middleware') || filePath.includes('test/middleware')) {
          return `jest.mock('../../src/middleware/${p1}'`;
        } else if (filePath.includes('test\\routes') || filePath.includes('test/routes')) {
          return `jest.mock('../../src/routes/${p1}'`;
        } else if (filePath.includes('test\\services') || filePath.includes('test/services')) {
          return `jest.mock('../../src/services/${p1}'`;
        } else if (filePath.includes('test\\utils') || filePath.includes('test/utils')) {
          return `jest.mock('../../src/utils/${p1}'`;
        }
        return match;
      });
      
      content = content.replace(/jest\.mock\('\.\.\/([^']+)'/g, "jest.mock('../../src/$1'");
      
      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`Fixed: ${filePath}`);
    }
  });
}

fixImports('./test');
console.log('All test imports fixed!');
