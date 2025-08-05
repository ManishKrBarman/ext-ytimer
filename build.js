#!/usr/bin/env node

/**
 * Build script for YTimer Extension
 * This script validates the extension structure and prepares it for distribution
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Building YTimer Extension...\n');

// Validate manifest.json
try {
    const manifest = JSON.parse(fs.readFileSync('manifest.json', 'utf8'));
    console.log('✅ Manifest validation passed');
    console.log(`   Extension: ${manifest.name} v${manifest.version}`);
} catch (error) {
    console.error('❌ Manifest validation failed:', error.message);
    process.exit(1);
}

// Check required files exist
const requiredFiles = [
    'src/js/background.js',
    'src/js/content-script.js',
    'src/js/newtab.js',
    'src/css/styles.css',
    'src/css/sticky-note.css',
    'src/html/newtab.html',
    'assets/icons/icon-16.png',
    'assets/icons/icon-32.png',
    'assets/icons/icon-48.png',
    'assets/icons/icon-128.png'
];

let allFilesExist = true;
requiredFiles.forEach(file => {
    if (fs.existsSync(file)) {
        console.log(`✅ ${file}`);
    } else {
        console.log(`❌ Missing: ${file}`);
        allFilesExist = false;
    }
});

if (!allFilesExist) {
    console.error('\n❌ Build failed: Missing required files');
    process.exit(1);
}

console.log('\n🎉 Build completed successfully!');
console.log('📦 Extension is ready for distribution');
