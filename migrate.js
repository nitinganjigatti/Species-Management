const fs = require('fs');
const path = require('path');

function walk(dir) {
    let results = [];
    const list = fs.readdirSync(dir);
    list.forEach(function(file) {
        file = path.join(dir, file);
        const stat = fs.statSync(file);
        if (stat && stat.isDirectory()) { 
            results = results.concat(walk(file));
        } else { 
            if (file.endsWith('.js') || file.endsWith('.jsx')) {
                results.push(file);
            }
        }
    });
    return results;
}

const basePath = '/Users/raghu/React/antz_web_dashboard';
const sourceDir = path.join(basePath, 'src/pages/diet');
const destDir = path.join(basePath, 'src/app/(module)/diet');

if (!fs.existsSync(sourceDir)) {
    console.log('Source directory not found:', sourceDir);
    process.exit(1);
}

const files = walk(sourceDir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Prepend 'use client' if not present
    if (!content.includes("'use client'") && !content.includes('"use client"')) {
        content = "'use client';\n" + content;
    }

    // 2. Replace router imports
    content = content.replace(/import\s+(?:Router\s*,\s*)?{\s*useRouter\s*}\s+from\s+['"]next\/router['"];?/g, 
        "import useSafeRouter from 'src/hooks/useSafeRouter';\nimport { useParams, useSearchParams } from 'next/navigation';");
    content = content.replace(/import\s*{\s*useRouter\s*}\s+from\s+['"]next\/router['"];?/g, 
        "import useSafeRouter from 'src/hooks/useSafeRouter';\nimport { useParams, useSearchParams } from 'next/navigation';");

    // 3. Inject useSafeRouter, useParams, useSearchParams
    const routerDeclRegex = /const\s+router\s*=\s*useRouter\(\)/g;
    const replacement = `const router = useSafeRouter();\n  const params = useParams();\n  const searchParams = useSearchParams();\n  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) };`;
    
    if (routerDeclRegex.test(content)) {
        content = content.replace(routerDeclRegex, replacement);
    }

    // 4. Replace router.query with routerQuery
    content = content.replace(/router\.query/g, 'routerQuery');
    content = content.replace(/router\.push/g, 'router.push');

    // Remove any remaining Router imports if any
    content = content.replace(/import\s+Router\s+from\s+['"]next\/router['"];?\n?/g, '');

    // Fix absolute imports (replace deep relative imports with src/ alias)
    content = content.replace(/from\s+['"]([^'"]+)['"]/g, (match, p1) => {
        if (p1.startsWith('.')) {
            const absolutePath = path.resolve(path.dirname(file), p1);
            if (absolutePath.includes('/src/views/') || absolutePath.includes('/src/components/') || absolutePath.includes('/src/lib/') || absolutePath.includes('/src/@core/')) {
                const relativeToRoot = absolutePath.substring(absolutePath.indexOf('/src/') + 1);
                return `from '${relativeToRoot}'`;
            }
        }
        return match;
    });

    // 5. Calculate dest file path
    const relativePath = path.relative(sourceDir, file);
    let newRelativePath = relativePath.replace(/\.js$/, '.tsx').replace(/\.jsx$/, '.tsx');
    
    // Replace index.js with page.tsx
    if (path.basename(newRelativePath) === 'index.tsx') {
        newRelativePath = path.join(path.dirname(newRelativePath), 'page.tsx');
    }

    const destFile = path.join(destDir, newRelativePath);

    // Write file
    fs.mkdirSync(path.dirname(destFile), { recursive: true });
    fs.writeFileSync(destFile, content);
    console.log('Migrated:', file, '->', destFile);
});

fs.rmSync(sourceDir, { recursive: true, force: true });
console.log('Removed old pages directory:', sourceDir);
