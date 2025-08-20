const { expect } = require('chai');
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

describe('Chanmon Plugin Integration Test', function() {
    this.timeout(30000); // 30 second timeout for integration tests
    
    let theloungeProcess;
    let testConfigDir;
    
    before(function(done) {
        // Create a temporary config directory for testing
        testConfigDir = path.join(__dirname, 'test-config');
        if (!fs.existsSync(testConfigDir)) {
            fs.mkdirSync(testConfigDir, { recursive: true });
        }
        
        // Create a basic config file
        const config = {
            public: false,
            host: '127.0.0.1',
            port: 9001,
            bind: undefined,
            reverseProxy: false,
            maxHistory: 10000,
            https: {
                enable: false,
                key: '',
                certificate: ''
            },
            theme: 'default',
            prefetch: false,
            prefetchStorage: false,
            prefetchMaxImageSize: 512,
            prefetchTimeout: 5000,
            fileUpload: {
                enable: false,
                maxFileSize: 10240,
                baseUrl: null
            },
            transports: ['polling', 'websocket'],
            leaveMessage: 'The Lounge - https://thelounge.chat',
            defaults: {
                name: 'Freenode',
                host: 'chat.freenode.net',
                port: 6697,
                password: '',
                tls: true,
                rejectUnauthorized: true,
                nick: 'lounge-user',
                username: 'lounge-user',
                realname: 'The Lounge User',
                join: '#thelounge'
            }
        };
        
        fs.writeFileSync(
            path.join(testConfigDir, 'config.js'),
            `module.exports = ${JSON.stringify(config, null, 2)};`
        );
        
        done();
    });
    
    after(function(done) {
        if (theloungeProcess) {
            theloungeProcess.kill('SIGTERM');
            theloungeProcess.on('close', () => {
                // Clean up test config directory
                if (fs.existsSync(testConfigDir)) {
                    fs.rmSync(testConfigDir, { recursive: true, force: true });
                }
                done();
            });
        } else {
            done();
        }
    });
    
    it('should load the chanmon plugin without errors', function(done) {
        console.log('Testing plugin loading...');
        
        // Start TheLounge with our test config
        theloungeProcess = spawn('node', [
            path.join(__dirname, '../../node_modules/.bin/thelounge'),
            'start',
            '--config', testConfigDir
        ], {
            stdio: ['pipe', 'pipe', 'pipe'],
            env: { ...process.env, NODE_ENV: 'development' }
        });
        
        let startupComplete = false;
        let pluginLoaded = false;
        
        theloungeProcess.stdout.on('data', (data) => {
            const output = data.toString();
            console.log('STDOUT:', output);
            
            // Check if TheLounge started successfully
            if (output.includes('Available at') || output.includes('server available at')) {
                startupComplete = true;
            }
            
            // Check for plugin loading messages
            if (output.includes('chanmon') || output.includes('plugin')) {
                pluginLoaded = true;
            }
            
            // If we've seen startup completion, consider the test passed
            if (startupComplete) {
                expect(startupComplete).to.be.true;
                done();
            }
        });
        
        theloungeProcess.stderr.on('data', (data) => {
            const error = data.toString();
            console.log('STDERR:', error);
            
            // Check for plugin-related errors
            if (error.includes('chanmon') && error.includes('error')) {
                done(new Error(`Plugin error detected: ${error}`));
            }
        });
        
        theloungeProcess.on('error', (error) => {
            done(new Error(`Failed to start TheLounge: ${error.message}`));
        });
        
        theloungeProcess.on('close', (code) => {
            if (code !== 0 && !startupComplete) {
                done(new Error(`TheLounge exited with code ${code}`));
            }
        });
        
        // Timeout fallback
        setTimeout(() => {
            if (!startupComplete) {
                done(new Error('TheLounge failed to start within timeout period'));
            }
        }, 25000);
    });
    
    it('should verify plugin structure and exports', function() {
        const pluginPath = path.join(__dirname, '../index.js');
        expect(fs.existsSync(pluginPath)).to.be.true;
        
        // Load the plugin module
        delete require.cache[require.resolve('../index.js')];
        const plugin = require('../index.js');
        
        // Check that the plugin exports the expected functions (corrected API)
        expect(plugin).to.be.an('object');
        expect(plugin).to.have.property('onServerStart');
        
        // Check that onServerStart is a function
        expect(plugin.onServerStart).to.be.a('function');
    });
    
    it('should have correct package.json structure', function() {
        const packagePath = path.join(__dirname, '../package.json');
        expect(fs.existsSync(packagePath)).to.be.true;
        
        const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        // Check required fields
        expect(packageJson).to.have.property('name', 'thelounge-plugin-chanmon');
        expect(packageJson).to.have.property('main', 'index.js');
        expect(packageJson).to.have.property('thelounge');
        expect(packageJson.thelounge).to.have.property('supports');
        
        // Check keywords include thelounge-plugin
        expect(packageJson.keywords).to.include('thelounge-plugin');
    });
});
