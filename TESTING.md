# Testing Guide for thelounge-plugin-chanmon

This document provides comprehensive testing instructions for the chanmon plugin.

## Automated Tests

### Basic Structure Tests
Run the basic structure validation tests:
```bash
npm run test:basic
# or
npx mocha test/simple.test.js
```

These tests verify:
- ✅ All required files exist
- ✅ Package.json has correct structure
- ✅ Plugin exports correct functions
- ✅ Command structure is proper
- ✅ TheLounge model references are correct
- ✅ README documentation is complete

## Manual Testing

Since this plugin requires integration with TheLounge, manual testing is essential.

### Prerequisites

1. **Install TheLounge**:
   ```bash
   npm install -g thelounge
   # or for development
   git clone https://github.com/thelounge/thelounge.git
   cd thelounge
   yarn install
   NODE_ENV=production yarn build
   ```

2. **Install the chanmon plugin**:
   ```bash
   # Method 1: Install from local directory
   thelounge install /path/to/thelounge-plugin-chanmon
   
   # Method 2: Copy to packages directory
   cp -r /path/to/thelounge-plugin-chanmon ~/.thelounge/packages/
   
   # Method 3: If published to npm
   thelounge install thelounge-plugin-chanmon
   ```

3. **Restart TheLounge**:
   ```bash
   thelounge restart
   ```

### Test Scenarios

#### Test 1: Plugin Loading
**Expected Result**: Plugin loads without errors

1. Start TheLounge with debug logging:
   ```bash
   DEBUG=thelounge* thelounge start
   ```

2. Check the logs for:
   - ✅ No error messages related to chanmon
   - ✅ Plugin registration messages
   - ✅ Command registration

#### Test 2: Channel Creation
**Expected Result**: #chanmon channel appears automatically

1. Connect to an IRC network through TheLounge
2. Verify:
   - ✅ A `#chanmon` channel appears in the channel list
   - ✅ The channel has a welcome message
   - ✅ Channel topic is set correctly

#### Test 3: Message Monitoring
**Expected Result**: Messages from other channels appear in #chanmon

1. Join at least 2 regular channels (e.g., #test1, #test2)
2. Send messages in these channels
3. Check #chanmon channel:
   - ✅ Messages appear with format: `[#channel] <nick> message`
   - ✅ Messages appear in real-time
   - ✅ Messages from different channels are properly prefixed

#### Test 4: Command Functionality
**Expected Result**: /chanmon command toggles monitoring

1. In any channel, type: `/chanmon`
2. Verify:
   - ✅ Status message appears in #chanmon
   - ✅ Monitoring is disabled (no new messages appear)
3. Type `/chanmon` again:
   - ✅ Status message shows monitoring enabled
   - ✅ New messages start appearing again

#### Test 5: System Message Filtering
**Expected Result**: System messages are filtered out

1. Join/leave channels while monitoring is active
2. Change nick while monitoring is active
3. Verify:
   - ✅ JOIN messages don't appear in #chanmon
   - ✅ PART messages don't appear in #chanmon
   - ✅ NICK changes don't appear in #chanmon
   - ✅ Only regular chat messages appear

#### Test 6: Action Messages
**Expected Result**: /me actions are monitored

1. In a monitored channel, type: `/me does something`
2. Check #chanmon:
   - ✅ Action appears with format: `[#channel] * nick does something`

#### Test 7: Multiple Networks
**Expected Result**: Each network gets its own #chanmon

1. Connect to multiple IRC networks
2. Verify:
   - ✅ Each network has its own #chanmon channel
   - ✅ Messages are only shown in the correct network's #chanmon
   - ✅ /chanmon command works independently per network

#### Test 8: Self-Message Prevention
**Expected Result**: Messages in #chanmon don't create loops

1. Type messages directly in #chanmon channel
2. Verify:
   - ✅ These messages don't get re-posted to #chanmon
   - ✅ No infinite loops occur

### Troubleshooting

#### Plugin Not Loading
1. Check TheLounge logs for errors
2. Verify plugin is in correct directory:
   ```bash
   thelounge list
   ```
3. Check file permissions
4. Verify package.json format

#### No #chanmon Channel
1. Check if plugin loaded successfully
2. Try reconnecting to IRC network
3. Check TheLounge version compatibility (requires 4.0.0+)

#### Messages Not Appearing
1. Verify monitoring is enabled with `/chanmon`
2. Check if you're in actual channels (not just connected)
3. Send test messages to verify IRC connection

#### Command Not Working
1. Verify command syntax: `/chanmon` (no arguments)
2. Check if plugin registered the command
3. Try in different channels

### Performance Testing

For high-traffic channels:

1. Join busy channels with lots of activity
2. Monitor for:
   - ✅ No significant lag in message delivery
   - ✅ No memory leaks over time
   - ✅ Proper message ordering

### Expected Test Results Summary

| Test | Status | Notes |
|------|--------|-------|
| Plugin Loading | ✅ Pass | Should load without errors |
| Channel Creation | ✅ Pass | #chanmon appears automatically |
| Message Monitoring | ✅ Pass | Real-time message streaming |
| Command Toggle | ✅ Pass | /chanmon enables/disables |
| System Filtering | ✅ Pass | Only chat messages monitored |
| Action Messages | ✅ Pass | /me actions are captured |
| Multiple Networks | ✅ Pass | Independent per network |
| Loop Prevention | ✅ Pass | No recursive monitoring |

### Reporting Issues

If any tests fail, please report with:
1. TheLounge version
2. Plugin version
3. Node.js version
4. Specific test that failed
5. Error logs
6. Steps to reproduce
