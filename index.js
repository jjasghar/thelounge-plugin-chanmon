"use strict";

// Plugin state - stores monitoring status per client/network
const pluginState = new Map();

// Command to toggle chanmon on/off
const chanmonCommand = {
    input: function (client, target, command, args) {
        console.log("ChanMon: Command executed!");
        
        const network = target.network;
        const networkId = network.uuid;
        const realClient = client.client;
        const stateKey = `${realClient.id}-${networkId}`;
        
        // Initialize state if it doesn't exist
        if (!pluginState.has(stateKey)) {
            pluginState.set(stateKey, {
                enabled: false,
                client: realClient,
                network: network,
                channel: null,
                listenersSetup: false,
                recentMessages: new Set()
            });
            console.log("ChanMon: Created new state");
        }
        
        const state = pluginState.get(stateKey);
        
        // Toggle monitoring
        state.enabled = !state.enabled;
        console.log("ChanMon: Monitoring is now:", state.enabled);
        
        // Check if chanmon channel already exists (using name without # to avoid IRC conflicts)
        let chanmonChannel = network.channels.find(chan => chan.name === "chanmon");
        
        if (!chanmonChannel) {
            console.log("ChanMon: Creating new chanmon channel...");
            
            try {
                // Use TheLounge's createChannel method with name without # prefix
                chanmonChannel = realClient.createChannel({
                    name: "chanmon",
                    type: "channel",
                    topic: "Channel Monitor - Local monitoring of all channels"
                });
                
                console.log("ChanMon: Channel created with ID:", chanmonChannel.id);
                
                // Add channel using proper method
                let channelIndex = network.addChannel(chanmonChannel);
                console.log("ChanMon: Channel added at index:", channelIndex);
                
                // Create welcome message
                const welcomeMsg = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: "message",
                    text: "Welcome to Channel Monitor! Automatic monitoring is " + (state.enabled ? "ENABLED" : "DISABLED") + ". Messages from other channels will appear here automatically.",
                    from: "chanmon",
                    time: new Date(),
                    self: false,
                    isLoggable: function() { return true; },
                    toJSON: function() { return this; }
                };
                
                // Add message to channel
                chanmonChannel.pushMessage(realClient, welcomeMsg);
                
                // Notify client about new channel
                if (realClient.manager && realClient.manager.sockets) {
                    realClient.manager.sockets.to(realClient.id).emit("join", {
                        network: network.uuid,
                        chan: chanmonChannel.getFilteredClone(realClient),
                        index: channelIndex
                    });
                    console.log("ChanMon: Join event sent to client");
                }
                
                // Set up automatic monitoring using IRC event hooking (only if not already set up)
                if (!state.listenersSetup) {
                    setupAutomaticMonitoring(realClient, network, chanmonChannel, state);
                    state.listenersSetup = true;
                    console.log("ChanMon: Automatic monitoring set up for the first time");
                } else {
                    console.log("ChanMon: Automatic monitoring already set up, skipping");
                }
                
            } catch (error) {
                console.error("ChanMon: Error creating channel:", error.message);
                client.runAsUser(`/echo ChanMon: Error creating channel: ${error.message}`, target.chan.id);
                return true;
            }
        } else {
            console.log("ChanMon: Using existing chanmon channel");
            
            // If channel exists but listeners aren't set up, set them up now
            if (!state.listenersSetup) {
                setupAutomaticMonitoring(realClient, network, chanmonChannel, state);
                state.listenersSetup = true;
                console.log("ChanMon: Set up automatic monitoring for existing channel");
            } else {
                console.log("ChanMon: Automatic monitoring already active for existing channel");
            }
        }
        
        // Store channel reference
        state.channel = chanmonChannel;
        
        // Handle arguments - if user provided text, add it as a monitored message
        if (args && args.length > 0) {
            const messageText = args.join(' ');
            
            // Create a manual monitored message
            const manualMsg = {
                id: Math.random().toString(36).substr(2, 9),
                type: "message",
                text: `[${target.chan.name}] <manual> ${messageText}`,
                from: "chanmon",
                time: new Date(),
                self: false,
                isLoggable: function() { return true; },
                toJSON: function() { return this; }
            };
            
            chanmonChannel.pushMessage(realClient, manualMsg);
            
            // Send manual message to client
            if (realClient.manager && realClient.manager.sockets) {
                realClient.manager.sockets.to(realClient.id).emit("msg", {
                    chan: chanmonChannel.id,
                    msg: manualMsg,
                    highlight: false,
                    unread: 1
                });
            }
            
            client.runAsUser(`/echo ChanMon: Message added to #chanmon: "${messageText}"`, target.chan.id);
        } else {
            // No arguments, just show status
            const statusText = `ChanMon: Automatic monitoring is ${state.enabled ? 'ENABLED' : 'DISABLED'}. Messages from other channels will ${state.enabled ? 'automatically appear' : 'not appear'} in #chanmon.`;
            client.runAsUser(`/echo ${statusText}`, target.chan.id);
        }
        
        console.log("ChanMon: Command completed successfully");
        return true;
    },
    allowDisconnected: false
};

function setupAutomaticMonitoring(realClient, network, chanmonChannel, state) {
    console.log("ChanMon: Setting up automatic monitoring via IRC events...");
    
    // Deduplication tracking is already in state
    
    // Try to hook into the IRC client's message events
    if (network.irc && network.irc.on) {
        console.log("ChanMon: IRC client available, setting up message listener");
        
        // Hook into IRC PRIVMSG events (this is how IRC sends channel messages)
        network.irc.on("privmsg", function(event) {
            console.log("ChanMon: IRC PRIVMSG received:", {
                target: event.target,
                nick: event.nick,
                message: event.message
            });
            
            if (state.enabled && event.target.startsWith('#') && event.target !== 'chanmon') {
                // Create deduplication key
                const dedupKey = `${event.target}-${event.nick}-${event.message}-${Date.now()}`;
                const shortKey = `${event.target}-${event.nick}-${event.message}`;
                
                // Check for recent duplicate (within last 5 seconds)
                if (state.recentMessages.has(shortKey)) {
                    console.log("ChanMon: Skipping duplicate message");
                    return;
                }
                
                // Add to recent messages and clean up old ones
                state.recentMessages.add(shortKey);
                setTimeout(() => {
                    state.recentMessages.delete(shortKey);
                }, 5000); // Remove after 5 seconds
                
                console.log("ChanMon: Processing IRC message for monitoring");
                
                // Create monitored message from IRC event
                const monitoredMsg = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: "message",
                    text: `[${event.target}] <${event.nick}> ${event.message}`,
                    from: "chanmon",
                    time: new Date(),
                    self: false,
                    isLoggable: function() { return true; },
                    toJSON: function() { return this; }
                };
                
                // Add to chanmon channel (this might automatically notify the client)
                chanmonChannel.pushMessage(realClient, monitoredMsg);
                console.log("ChanMon: Message added to channel. Total messages now:", chanmonChannel.messages.length);
                console.log("ChanMon: Automatic message processed from", event.target, "- Message ID:", monitoredMsg.id);
                
                // Note: Removed manual socket.emit to prevent duplication
                // pushMessage should handle client notification automatically
            }
        });
        
        // Also hook into ACTION events (for /me commands)
        network.irc.on("action", function(event) {
            console.log("ChanMon: IRC ACTION received:", {
                target: event.target,
                nick: event.nick,
                message: event.message
            });
            
            if (state.enabled && event.target.startsWith('#') && event.target !== 'chanmon') {
                const monitoredMsg = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: "message",
                    text: `[${event.target}] * ${event.nick} ${event.message}`,
                    from: "chanmon",
                    time: new Date(),
                    self: false,
                    isLoggable: function() { return true; },
                    toJSON: function() { return this; }
                };
                
                chanmonChannel.pushMessage(realClient, monitoredMsg);
                
                if (realClient.manager && realClient.manager.sockets) {
                    realClient.manager.sockets.to(realClient.id).emit("msg", {
                        chan: chanmonChannel.id,
                        msg: monitoredMsg,
                        highlight: false,
                        unread: 1
                    });
                    console.log("ChanMon: Automatic action sent to client from", event.target);
                }
            }
        });
        
        console.log("ChanMon: IRC event listeners set up successfully");
    } else {
        console.log("ChanMon: IRC client not available for automatic monitoring");
    }
}

module.exports = {
    onServerStart: api => {
        console.log("ChanMon plugin starting...");
        
        // Add the main chanmon command
        api.Commands.add("chanmon", chanmonCommand);
        
        // Note: chanmonadd command removed for now to focus on automatic monitoring
        
        console.log("ChanMon plugin loaded successfully!");
        console.log("Usage:");
        console.log("  /chanmon - Create #chanmon channel and toggle automatic monitoring");
        console.log("  /chanmon <message> - Add a custom message to #chanmon");
        console.log("  /chanmonadd - Add the last message from current channel to #chanmon");
        console.log("This version attempts AUTOMATIC monitoring via IRC event hooks!");
    }
};