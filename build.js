const ncc = require('@vercel/ncc');
const path = require('path');
const fs = require('fs');

async function main() {
    // Build the extension
    const { code, map, assets } = await ncc(path.join(__dirname, 'src/extension.ts'), {
        minify: true,
        sourceMap: true,
        target: 'es2022',
        externals: ['vscode'],
        cache: false,
        filterAssetFiles: (path) => !path.includes('node_modules'),
    });

    // Ensure dist directory exists
    if (!fs.existsSync('dist')) {
        fs.mkdirSync('dist');
    }

    // Write the bundled code
    fs.writeFileSync(path.join(__dirname, 'dist/extension.js'), code);
    if (map) {
        fs.writeFileSync(path.join(__dirname, 'dist/extension.js.map'), map);
    }

    // Copy assets if any
    for (const [filename, asset] of Object.entries(assets)) {
        const filepath = path.join(__dirname, 'dist', filename);
        const dirpath = path.dirname(filepath);
        if (!fs.existsSync(dirpath)) {
            fs.mkdirSync(dirpath, { recursive: true });
        }
        fs.writeFileSync(filepath, asset.source);
    }

    // Copy sqlite3 native modules
    const sqlite3Path = path.join(__dirname, 'node_modules/sqlite3');
    if (fs.existsSync(sqlite3Path)) {
        const bindingPath = path.join(sqlite3Path, 'lib/binding');
        if (fs.existsSync(bindingPath)) {
            const targetPath = path.join(__dirname, 'dist/binding');
            fs.cpSync(bindingPath, targetPath, { recursive: true });
        }
    }

    console.log('Build completed successfully!');
}

main().catch(err => {
    console.error('Build failed:', err);
    process.exit(1);
});