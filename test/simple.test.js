const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

describe('Chanmon Plugin Basic Tests', function() {
    it('should have all required files', function() {
        const files = ['package.json', 'index.js', 'README.md', 'LICENSE'];
        files.forEach(file => {
            const filePath = path.join(__dirname, '..', file);
            expect(fs.existsSync(filePath), `${file} should exist`).to.be.true;
        });
    });
    
    it('should have valid package.json', function() {
        const packagePath = path.join(__dirname, '../package.json');
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check required fields
        expect(packageJson).to.have.property('name', 'thelounge-plugin-chanmon');
        expect(packageJson).to.have.property('main', 'index.js');
        expect(packageJson).to.have.property('thelounge');
        expect(packageJson.thelounge).to.have.property('supports');
        
        // Check keywords include thelounge-plugin
        expect(packageJson.keywords).to.include('thelounge-plugin');
        expect(packageJson.keywords).to.include('chanmon');
    });
    
    it('should have valid main entry point', function() {
        const indexPath = path.join(__dirname, '../index.js');
        expect(fs.existsSync(indexPath)).to.be.true;
        
        // Check that the file is not empty
        const content = fs.readFileSync(indexPath, 'utf8');
        expect(content.length).to.be.greaterThan(0);
        expect(content).to.include('module.exports');
    });
    
    it('should export correct plugin structure', function() {
        // We can't actually require the plugin without TheLounge modules,
        // but we can check the file structure
        const indexPath = path.join(__dirname, '../index.js');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Check for required exports and structure
        expect(content).to.include('onServerStart');
        expect(content).to.include('module.exports');
        expect(content).to.include('api.Commands.add');
        expect(content).to.include('chanmon');
    });
    
    it('should have proper command structure', function() {
        const indexPath = path.join(__dirname, '../index.js');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Check for command structure
        expect(content).to.include('chanmonCommand');
        expect(content).to.include('input: function');
        expect(content).to.include('allowDisconnected');
    });
    
    it('should reference correct TheLounge models', function() {
        const indexPath = path.join(__dirname, '../index.js');
        const content = fs.readFileSync(indexPath, 'utf8');
        
        // Check for correct model imports
        expect(content).to.include('thelounge/src/models/chan');
        expect(content).to.include('thelounge/src/models/msg');
    });
    
    it('should have proper README documentation', function() {
        const readmePath = path.join(__dirname, '../README.md');
        const content = fs.readFileSync(readmePath, 'utf8');
        
        // Check for essential documentation sections
        expect(content).to.include('# thelounge-plugin-chanmon');
        expect(content).to.include('## Installation');
        expect(content).to.include('## Usage');
        expect(content).to.include('/chanmon');
        expect(content).to.include('#chanmon');
    });
});
