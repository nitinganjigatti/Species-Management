const fs = require('fs');

const files = [
    '/Users/raghu/React/antz_web_dashboard/src/views/pages/diet/add-diet/StepBasicDetails.js',
    '/Users/raghu/React/antz_web_dashboard/src/views/pages/diet/DietDetailCard/index.js',
    '/Users/raghu/React/antz_web_dashboard/src/views/pages/diet/feed/feedoverview.js',
    '/Users/raghu/React/antz_web_dashboard/src/components/diet/ChangeDietname.js',
    '/Users/raghu/React/antz_web_dashboard/src/components/diet/ChangeRecipename.js'
];

files.forEach(file => {
    if (!fs.existsSync(file)) return;
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
    content = content.replace(/import\s+Router\s+from\s+['"]next\/router['"];?\n?/g, "");

    // 3. Inject useSafeRouter, useParams, useSearchParams
    const routerDeclRegex = /const\s+router\s*=\s*useRouter\(\)/g;
    const replacement = `const router = useSafeRouter();\n  const params = useParams();\n  const searchParams = useSearchParams();\n  const routerQuery = { ...params, ...(searchParams ? Object.fromEntries(searchParams.entries()) : {}) };`;
    
    if (routerDeclRegex.test(content)) {
        content = content.replace(routerDeclRegex, replacement);
    } else {
        // If there's no router = useRouter(), but there is useSafeRouter import, we might need to add it if they use Router.push
        if (content.includes('Router.push') || content.includes('router.push')) {
            // Find the component function start and inject it
            content = content.replace(/(const\s+\w+\s*=\s*\([^)]*\)\s*=>\s*\{)/, 
                `$1\n  ${replacement}\n`);
        }
    }

    // 4. Replace router.query with routerQuery
    content = content.replace(/router\.query/g, 'routerQuery');

    // 5. Replace Router.push / Router.back
    if (content.includes('Router.push(') || content.includes('Router.replace(') || content.includes('Router.back(')) {
        content = content.replace(/Router\.push\(\{\s*pathname:\s*['"]([^'"]+)['"],\s*query:\s*\{\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_?.\[\]]+)(?:,\s*([^:]+):\s*([^}]+))?\s*\}\s*\}\)/g, 
            (match, p1, p2, p3, p4, p5) => {
                if (p4 && p5) return `router.push(\`${p1}?${p2}=\${${p3}}&${p4}=\${${p5}}\`)`;
                return `router.push(\`${p1}?${p2}=\${${p3}}\`)`;
            });
        content = content.replace(/Router\.push\(\{\s*pathname:\s*`([^`]+)`,\s*query:\s*\{\s*([a-zA-Z0-9_]+):\s*([a-zA-Z0-9_?.\[\]]+)\s*\}\s*\}\)/g, 
            "router.push(`$1?$2=${$3}`)");
        content = content.replace(/Router\.push\(\{\s*pathname:\s*['"`]([^'"`]+)['"`]\s*\}\)/g, 
            "router.push(`$1`)");
        content = content.replace(/Router\.push\(/g, 'router.push(');
        content = content.replace(/Router\.back\(/g, 'router.back(');
        content = content.replace(/Router\.replace\(/g, 'router.replace(');
    }

    // Extra case for ChangeDietname where action and name are passed
    content = content.replace(/router\.push\(`([^`]+)\?id=\$\{([^}]+)\}&action=\$\{([^}]+)\}&name=\$\{([^}]+)\}`\)/, "router.push(`$1?id=${$2}&action=${$3}&name=${$4}`)");

    fs.writeFileSync(file, content);
    console.log('Fixed:', file);
});
