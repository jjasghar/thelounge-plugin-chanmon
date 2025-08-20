const { expect } = require('chai');
const path = require('path');
const fs = require('fs');

// Mock the require calls for TheLounge modules
const Module = require('module');
const originalRequire = Module.prototype.require;

// Create mock constructors
function MockChan(options) {
    this.type = options.type;
    this.name = options.name;
    this.topic = options.topic;
    this.id = Math.random().toString(36);
    this.pushMessage = function(client, msg) {
        // Mock implementation
    };
    this.getFilteredClone = function(client) {
        return { ...this };
    };
}

MockChan.Type = {
    CHANNEL: 'channel',
    QUERY: 'query'
};

function MockMsg(options) {
    this.type = options.type;
    this.text = options.text;
    this.from = options.from;
    this.time = options.time;
    this.self = options.self;
}

MockMsg.Type = {
    MESSAGE: 'message',
    ACTION: 'action',
    JOIN: 'join',
    PART: 'part',
    QUIT: 'quit',
    NICK: 'nick',
    MODE: 'mode',
    TOPIC: 'topic'
};

Module.prototype.require = function(id) {
    if (id === 'thelounge/src/models/chan') {
        return MockChan;
    }
    if (id === 'thelounge/src/models/msg') {
        return MockMsg;
    }
    return originalRequire.apply(this, arguments);
};

describe('Chanmon Plugin Unit Tests', function() {
    let plugin;
    let mockAPI;
    let mockClient;
    let mockNetwork;
    let mockChannel;
    
    beforeEach(function() {
        // Reset module cache
        delete require.cache[require.resolve('../index.js')];
        
        // Create mock API
        mockAPI = {
            Commands: {
                add: function(name, command) {
                    this[name] = command;
                }
            },
            ClientManager: {
                listeners: {},
                on: function(event, callback) {
                    this.listeners[event] = callback;
                }
            }
        };
        
        // Create mock client
        mockClient = {
            networks: [],
            emit: function(event, data) {
                // Mock emit
            },
            on: function(event, callback) {
                this.listeners = this.listeners || {};
                this.listeners[event] = callback;
            },
            find: function(networkId) {
                return this.networks.find(n => n.uuid === networkId);
            }
        };
        
        // Create mock network
        mockNetwork = {
            uuid: 'test-network-123',
            channels: [],
            getChannel: function(chanId) {
                return this.channels.find(c => c.id === chanId);
            }
        };
        
        // Create mock channel
        mockChannel = {
            id: 'test-channel-456',
            name: '#testchan',
            type: 'channel'
        };
        
        mockClient.networks.push(mockNetwork);
        mockNetwork.channels.push(mockChannel);
        
        // Load the plugin
        plugin = require('../index.js');
    });
    
    afterEach(function() {
        // Restore original require
        Module.prototype.require = originalRequire;
    });
    
    it('should export onServerStart function', function() {
        expect(plugin).to.have.property('onServerStart');
        expect(plugin.onServerStart).to.be.a('function');
    });
    
    it('should register chanmon command when server starts', function() {
        // Call onServerStart
        plugin.onServerStart(mockAPI);
        
        // Check that chanmon command was registered
        expect(mockAPI.Commands).to.have.property('chanmon');
        expect(mockAPI.Commands.chanmon).to.have.property('input');
        expect(mockAPI.Commands.chanmon.input).to.be.a('function');
        expect(mockAPI.Commands.chanmon).to.have.property('allowDisconnected', false);
    });
    
    it('should set up client event listeners', function() {
        // Call onServerStart
        plugin.onServerStart(mockAPI);
        
        // Check that event listeners were registered
        expect(mockAPI.ClientManager.listeners).to.have.property('client:connect');
        expect(mockAPI.ClientManager.listeners).to.have.property('client:network:connected');
        expect(mockAPI.ClientManager.listeners['client:connect']).to.be.a('function');
        expect(mockAPI.ClientManager.listeners['client:network:connected']).to.be.a('function');
    });
    
    it('should create chanmon channel when client connects', function() {
        // Call onServerStart to set up listeners
        plugin.onServerStart(mockAPI);
        
        // Simulate client connect
        const clientConnectHandler = mockAPI.ClientManager.listeners['client:connect'];
        clientConnectHandler(mockClient);
        
        // Check that chanmon channel was created
        const chanmonChannel = mockNetwork.channels.find(chan => chan.name === '#chanmon');
        expect(chanmonChannel).to.exist;
        expect(chanmonChannel.name).to.equal('#chanmon');
        expect(chanmonChannel.topic).to.equal('Channel Monitor - Real-time stream of all channel activity');
    });
    
    it('should handle chanmon command correctly', function() {
        // Call onServerStart to register command
        plugin.onServerStart(mockAPI);
        
        // Set up initial state by simulating client connect
        const clientConnectHandler = mockAPI.ClientManager.listeners['client:connect'];
        clientConnectHandler(mockClient);
        
        // Create mock target for command
        const mockTarget = {
            network: mockNetwork,
            chan: mockChannel
        };
        
        // Execute chanmon command
        const chanmonCommand = mockAPI.Commands.chanmon;
        chanmonCommand.input(mockClient, mockTarget, 'chanmon', []);
        
        // The command should execute without errors
        // (More detailed testing would require more sophisticated mocking)
    });
    
    it('should not create duplicate chanmon channels', function() {
        // Call onServerStart to set up listeners
        plugin.onServerStart(mockAPI);
        
        // Simulate client connect twice
        const clientConnectHandler = mockAPI.ClientManager.listeners['client:connect'];
        clientConnectHandler(mockClient);
        clientConnectHandler(mockClient);
        
        // Check that only one chanmon channel exists
        const chanmonChannels = mockNetwork.channels.filter(chan => chan.name === '#chanmon');
        expect(chanmonChannels).to.have.length(1);
    });
});
