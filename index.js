"use strict";

const Chan = require("thelounge/src/models/chan");
const Msg = require("thelounge/src/models/msg");

// Plugin state - stores chanmon channels and settings per client
const pluginState = new Map();

// Command to toggle chanmon on/off
const chanmonCommand = {
    input: function (client, target, command, args) {
        const network = target.network;
        const networkId = network.uuid;
        const state = pluginState.get(networkId);
        
        if (!state) {
            return;
        }
        
        // Toggle monitoring
        state.enabled = !state.enabled;
        
        // Send status message to chanmon channel
        const statusMsg = new Msg({
            type: Msg.Type.MESSAGE,
            text: `Channel monitoring is now ${state.enabled ? 'enabled' : 'disabled'}`,
            from: "chanmon",
            time: new Date()
        });
        
        state.channel.pushMessage(client, statusMsg);
        
        // Emit to client
        client.emit("msg", {
            chan: state.channel.id,
            msg: statusMsg,
            highlight: false,
            unread: 1
        });
    },
    allowDisconnected: false
};

function initializeChanmon(client, network) {
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
        
        chanmonChannel.pushMessage(client, welcomeMsg);
        network.channels.push(chanmonChannel);
        
        // Initialize plugin state for this network
        pluginState.set(networkId, {
            enabled: true,
            channel: chanmonChannel,
            client: client
        });
        
        // Emit channel creation to client
        client.emit("join", {
            network: network.uuid,
            chan: chanmonChannel.getFilteredClone(client)
        });
    }
}

module.exports = {
    onServerStart: api => {
        // Add the chanmon command
        api.Commands.add("chanmon", chanmonCommand);
        
        // Hook into client events to initialize chanmon channels
        api.ClientManager.on("client:connect", (client) => {
            // Initialize chanmon for each network when client connects
            client.networks.forEach(network => {
                initializeChanmon(client, network);
            });
            
            // Hook into message events for this client
            client.on("msg", (data) => {
                const network = client.find(data.network);
                const channel = network.getChannel(data.chan);
                
                if (!network || !channel) return;
                
                const networkId = network.uuid;
                const state = pluginState.get(networkId);
                
                // Only monitor if enabled and not the chanmon channel itself
                if (!state || !state.enabled || channel.name === "#chanmon") {
                    return;
                }
                
                // Skip system messages and certain message types
                if (data.msg.type === Msg.Type.JOIN ||
                    data.msg.type === Msg.Type.PART ||
                    data.msg.type === Msg.Type.QUIT ||
                    data.msg.type === Msg.Type.NICK ||
                    data.msg.type === Msg.Type.MODE ||
                    data.msg.type === Msg.Type.TOPIC) {
                    return;
                }
                
                // Create monitored message with channel prefix
                const monitoredMsg = new Msg({
                    type: data.msg.type,
                    text: `[${channel.name}] <${data.msg.from}> ${data.msg.text}`,
                    from: "chanmon",
                    time: data.msg.time,
                    self: data.msg.self
                });
                
                // Add the message to chanmon channel
                state.channel.pushMessage(client, monitoredMsg);
                
                // Emit to client
                client.emit("msg", {
                    chan: state.channel.id,
                    msg: monitoredMsg,
                    highlight: false,
                    unread: 1
                });
            });
        });
        
        // Handle new network connections
        api.ClientManager.on("client:network:connected", (client, network) => {
            initializeChanmon(client, network);
        });
    }
};
