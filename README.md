# portwatch

Lightweight daemon that monitors local port usage and logs process ownership changes over time.

## Installation

```bash
npm install -g portwatch
```

## Usage

Start the daemon to begin monitoring all active ports:

```bash
portwatch start
```

Watch a specific port and log ownership changes:

```bash
portwatch watch --port 8080
```

Output is written to `~/.portwatch/events.log` by default:

```
[2024-03-15T10:42:01Z] PORT 8080 | PID 3291 (node) → PID 4107 (python3)
[2024-03-15T10:45:33Z] PORT 3000 | OPENED by PID 5842 (node)
[2024-03-15T10:51:17Z] PORT 3000 | CLOSED (was PID 5842)
```

### Options

| Flag | Description | Default |
|------|-------------|---------|
| `--port <n>` | Watch a specific port | all ports |
| `--interval <ms>` | Polling interval in milliseconds | `1000` |
| `--log <path>` | Custom log file path | `~/.portwatch/events.log` |
| `--quiet` | Suppress stdout output | `false` |

### Programmatic API

```typescript
import { PortWatch } from 'portwatch';

const watcher = new PortWatch({ interval: 500 });

watcher.on('change', (event) => {
  console.log(`Port ${event.port} is now owned by PID ${event.pid}`);
});

watcher.start();
```

## Requirements

- Node.js 18+
- macOS or Linux (Windows support planned)

## License

MIT