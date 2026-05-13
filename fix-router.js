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
            if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                results.push(file);
            }
        }
    });
    return results;
}

const dir = '/Users/raghu/React/antz_web_dashboard/src/app/(module)/diet';
const files = walk(dir);

files.forEach(file => {
    let content = fs.readFileSync(file, 'utf8');
    let changed = false;

    // 1. Replace Router.push('...') to router.push('...')
    if (content.includes('Router.push(')) {
        // Convert Router.push({ pathname: '...', query: { id: id } })
        content = content.replace(/Router\.push\(\{\s*pathname:\s*['"]([^'"]+)['"],\s*query:\s*\{\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_?.\[\]]+)\s*\}\s*\}\)/g, 
            "router.push(`$1?$2=${$3}`)");

        content = content.replace(/Router\.push\(\{\s*pathname:\s*`([^`]+)`,\s*query:\s*\{\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_?.\[\]]+)\s*\}\s*\}\)/g, 
            "router.push(`$1?$2=${$3}`)");
            
        // for pathname without query
        content = content.replace(/Router\.push\(\{\s*pathname:\s*['"`]([^'"`]+)['"`]\s*\}\)/g, 
            "router.push(`$1`)");

        // general replacement
        content = content.replace(/Router\.push\(/g, 'router.push(');
        changed = true;
    }

    if (content.includes('Router.back(')) {
        content = content.replace(/Router\.back\(/g, 'router.back(');
        changed = true;
    }

    if (content.includes('Router.replace(')) {
        content = content.replace(/Router\.replace\(/g, 'router.replace(');
        changed = true;
    }
    
    // 2. Fix sibling folder indexes
    // Examples: from '../ingredient-list' -> from '../ingredient-list/page'
    const importsToFix = [
        '../ingredient-list',
        '../recipe-list',
        '../combo-list' // if any
    ];
    
    importsToFix.forEach(imp => {
        if (content.includes(`from '${imp}'`) || content.includes(`from "${imp}"`)) {
            content = content.replace(new RegExp(`from ['"]${imp}['"]`, 'g'), `from '${imp}/page'`);
            changed = true;
        }
    });
    
    if (changed) {
        fs.writeFileSync(file, content);
        console.log('Fixed:', file);
    }
});
