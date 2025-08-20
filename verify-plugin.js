#!/usr/bin/env node
"use strict";

/**
 * Plugin Verification Script
 * 
 * This script verifies that the chanmon plugin is properly structured
 * and ready for installation in TheLounge.
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Verifying thelounge-plugin-chanmon...\n');

const checks = [
    {
        name: 'Package.json exists and is valid',
        check: () => {
            const packagePath = path.join(__dirname, 'package.json');
            if (!fs.existsSync(packagePath)) return false;
            
            const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
            return pkg.name === 'thelounge-plugin-chanmon' && 
                   pkg.main === 'index.js' &&
                   pkg.thelounge &&
                   pkg.keywords.includes('thelounge-plugin');
        }
    },
    {
        name: 'Main entry point (index.js) exists',
        check: () => fs.existsSync(path.join(__dirname, 'index.js'))
    },
    {
        name: 'Plugin exports onServerStart function',
        check: () => {
            const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
            return content.includes('onServerStart') && content.includes('module.exports');
        }
    },
    {
        name: 'Plugin registers chanmon command',
        check: () => {
            const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
            return content.includes('api.Commands.add') && content.includes('chanmon');
        }
    },
    {
        name: 'README.md exists with documentation',
        check: () => {
            if (!fs.existsSync(path.join(__dirname, 'README.md'))) return false;
            const content = fs.readFileSync(path.join(__dirname, 'README.md'), 'utf8');
            return content.includes('thelounge-plugin-chanmon') && 
                   content.includes('Installation') &&
                   content.includes('Usage');
        }
    },
    {
        name: 'LICENSE file exists',
        check: () => fs.existsSync(path.join(__dirname, 'LICENSE'))
    },
    {
        name: 'Testing infrastructure is present',
        check: () => {
            return fs.existsSync(path.join(__dirname, 'test')) &&
                   fs.existsSync(path.join(__dirname, 'TESTING.md'));
        }
    },
    {
        name: 'Uses correct TheLounge model paths',
        check: () => {
            const content = fs.readFileSync(path.join(__dirname, 'index.js'), 'utf8');
            return content.includes('thelounge/src/models/chan') &&
                   content.includes('thelounge/src/models/msg');
        }
    }
];

let passed = 0;
let failed = 0;

checks.forEach(check => {
    try {
        if (check.check()) {
            console.log(`✅ ${check.name}`);
            passed++;
        } else {
            console.log(`❌ ${check.name}`);
            failed++;
        }
    } catch (error) {
        console.log(`❌ ${check.name} (Error: ${error.message})`);
        failed++;
    }
});

console.log(`\n📊 Results: ${passed} passed, ${failed} failed\n`);

if (failed === 0) {
    console.log('🎉 Plugin verification successful!');
    console.log('📦 Ready for installation with: thelounge install thelounge-plugin-chanmon');
    console.log('📚 See TESTING.md for manual testing instructions');
    process.exit(0);
} else {
    console.log('⚠️  Plugin verification failed. Please fix the issues above.');
    process.exit(1);
}
