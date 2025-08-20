# thelounge-plugin-chanmon

A plugin for [TheLounge](https://github.com/thelounge/thelounge) that creates a channel monitor to stream all channel activity in real-time.

## Features

- **Real-time monitoring**: Automatically creates a `#chanmon` channel that displays all messages from channels you're in
- **Channel prefixes**: Each message is prefixed with the originating channel name for easy identification
- **Toggle control**: Use `/chanmon` command to enable/disable monitoring
- **Clean output**: Filters out system messages (joins, parts, quits, etc.) to focus on actual conversations
- **Action support**: Monitors both regular messages and IRC actions
- **Per-network**: Each IRC network gets its own chanmon channel

## Installation

### Via TheLounge package manager (recommended)

If you have installed TheLounge via NPM/Yarn:
```bash
thelounge install thelounge-plugin-chanmon
```

If you have installed TheLounge from source:
```bash
node index.js install thelounge-plugin-chanmon
```

### Manual installation

1. Clone or download this repository to your TheLounge's `packages` directory
2. Restart TheLounge
3. The plugin will be automatically loaded

## Usage

### Basic Usage

Once installed, the plugin will automatically:
1. Create a `#chanmon` channel on each IRC network you connect to
2. Start monitoring all channel activity in real-time
3. Display messages in the format: `[#channel] <nick> message`

### Commands

- `/chanmon` - Toggle channel monitoring on/off for the current network

### Example Output

```
[#general] <alice> Hey everyone, how's it going?
[#development] <bob> Just pushed the new feature to staging
[#random] * charlie is away
[#general] <dave> @alice doing great, thanks for asking!
```

## Configuration

The plugin works out of the box with no configuration required. It will:
- Automatically enable monitoring when you connect to a network
- Create the `#chanmon` channel if it doesn't exist
- Start streaming messages immediately

## What gets monitored

**Monitored:**
- Regular channel messages
- IRC actions (`/me` commands)

**Not monitored:**
- Join/part/quit messages
- Nick changes
- Mode changes
- Topic changes
- Messages from the `#chanmon` channel itself (prevents loops)

## Compatibility

- **TheLounge version**: 4.0.0 or higher
- **Node.js version**: 14.0.0 or higher

## Development

To contribute to this plugin:

1. Fork the repository
2. Make your changes
3. Test with a local TheLounge installation
4. Submit a pull request

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

If you encounter any issues or have feature requests, please open an issue on the [GitHub repository](https://github.com/jjasghar/thelounge-plugin-chanmon/issues).

## Related Plugins

- [thelounge-plugin-closepms](https://www.npmjs.com/package/thelounge-plugin-closepms) - Close all open PMs on a network
- [thelounge-plugin-autodownload](https://www.npmjs.com/package/thelounge-plugin-autodownload) - Autodownload torrents in qBittorrent
