"use strict";

const Chan = require("thelounge/server/models/chan");
const Msg = require("thelounge/server/models/msg");

// Plugin state
const pluginState = new Map();

function onServerStart(manager) {
    // Initialize plugin for each network when server starts
    manager.getUsers().forEach(user => {
        user.networks.forEach(network => {
            initializeChanmon(network);
        });
    });
}

function onConnection(network) {
    // Initialize chanmon when a new network connection is established
    initializeChanmon(network);
}

function initializeChanmon(network) {
    const networkId = network.uuid;
    
    // Check if chanmon channel already exists
    let chanmonChannel = network.channels.find(chan => chan.name === "#chanmon");
    
    if (!chanmonChannel) {
        // Create the chanmon channel
        chanmonChannel = new Chan({
            type: Chan.Type.CHANNEL,
            name: "#chanmon",
            topic: "Channel Monitor - Real-time stream of all channel activity"
        });
        
        // Add a welcome message
        const welcomeMsg = new Msg({
            type: Msg.Type.MESSAGE,
            text: "Welcome to Channel Monitor! This channel will show activity from all your channels. Use /chanmon to toggle monitoring on/off.",
            from: "chanmon",
            time: new Date()
        });
        
        chanmonChannel.pushMessage(network.user, welcomeMsg);
        network.channels.push(chanmonChannel);
        
        // Initialize plugin state for this network
        pluginState.set(networkId, {
            enabled: true,
            channel: chanmonChannel
        });
        
        // Emit channel creation to client
        network.user.emit("join", {
            network: network.uuid,
            chan: chanmonChannel.getFilteredClone(network.user)
        });
    }
}

function onMessage(network, channel, message) {
    const networkId = network.uuid;
    const state = pluginState.get(networkId);
    
    // Only monitor if enabled and not the chanmon channel itself
    if (!state || !state.enabled || channel.name === "#chanmon") {
        return;
    }
    
    // Skip system messages and certain message types
    if (message.type === Msg.Type.JOIN ||
        message.type === Msg.Type.PART ||
        message.type === Msg.Type.QUIT ||
        message.type === Msg.Type.NICK ||
        message.type === Msg.Type.MODE ||
        message.type === Msg.Type.TOPIC) {
        return;
    }
    
    // Create monitored message with channel prefix
    const monitoredMsg = new Msg({
        type: message.type,
        text: `[${channel.name}] <${message.from}> ${message.text}`,
        from: "chanmon",
        time: message.time,
        self: message.self
    });
    
    // Add the message to chanmon channel
    state.channel.pushMessage(network.user, monitoredMsg);
    
    // Emit to client
    network.user.emit("msg", {
        chan: state.channel.id,
        msg: monitoredMsg,
        highlight: false,
        unread: 1
    });
}

function onCommand(network, channel, command, args) {
    if (command !== "chanmon") {
        return;
    }
    
    const networkId = network.uuid;
    const state = pluginState.get(networkId);
    
    if (!state) {
        return;
    }
    
    // Toggle monitoring
    state.enabled = !state.enabled;
    
    const statusMsg = new Msg({
        type: Msg.Type.MESSAGE,
        text: `Channel monitoring is now ${state.enabled ? 'enabled' : 'disabled'}`,
        from: "chanmon",
        time: new Date()
    });
    
    state.channel.pushMessage(network.user, statusMsg);
    
    // Emit to client
    network.user.emit("msg", {
        chan: state.channel.id,
        msg: statusMsg,
        highlight: false,
        unread: 1
    });
    
    return true; // Command handled
}

function onAction(network, channel, message) {
    const networkId = network.uuid;
    const state = pluginState.get(networkId);
    
    // Only monitor if enabled and not the chanmon channel itself
    if (!state || !state.enabled || channel.name === "#chanmon") {
        return;
    }
    
    // Create monitored action message with channel prefix
    const monitoredMsg = new Msg({
        type: Msg.Type.ACTION,
        text: `[${channel.name}] * ${message.from} ${message.text}`,
        from: "chanmon",
        time: message.time,
        self: message.self
    });
    
    // Add the message to chanmon channel
    state.channel.pushMessage(network.user, monitoredMsg);
    
    // Emit to client
    network.user.emit("msg", {
        chan: state.channel.id,
        msg: monitoredMsg,
        highlight: false,
        unread: 1
    });
}

module.exports = {
    onServerStart,
    onConnection,
    onMessage,
    onCommand,
    onAction
};
