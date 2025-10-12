# Debug Console Visual Guide

## What You'll See

### When Connection is Healthy ✅
The provider card shows a **green "Connected"** status indicator with no debug console displayed. The card is clean and minimal.

### When Connection Fails ❌
The provider card automatically expands to show a comprehensive debug console section.

## Debug Console Layout

```
┌─────────────────────────────────────────────────────────────┐
│ Provider Card Header                                        │
│ ┌─────┐ Provider Name                     ┌──────────────┐ │
│ │ 🏢  │ xAI Grok Provider                 │ ● Failed     │ │
│ └─────┘ xai Provider                      └──────────────┘ │
├─────────────────────────────────────────────────────────────┤
│ Health Status                                               │
│ ❌ Connection Failed                                        │
│ ⏰ Configured                                              │
│ 💻 3 models                                                │
├─────────────────────────────────────────────────────────────┤
│ 🖥️ Debug Console                   [2 errors]   [📋 Copy] │
│                                                             │
│ ┌───────────────────────────────────────────────────────┐ │
│ │ Terminal-style black background                       │ │
│ │                                                         │ │
│ │ 17:45:23 INFO  Starting health check                  │ │
│ │              endpoint: https://api.x.ai/v1            │ │
│ │              models: 3                                │ │
│ │                                                         │ │
│ │ 17:45:23 INFO  API key decrypted successfully         │ │
│ │              keyLength: 48                            │ │
│ │              keyPrefix: xai-...                       │ │
│ │                                                         │ │
│ │ 17:45:25 ERROR Connection failed                      │ │
│ │              error: X.AI API Key Permission Error     │ │
│ │              endpoint: https://api.x.ai/v1            │ │
│ │              latency: 1847                            │ │
│ │                                                         │ │
│ │ 17:45:26 ERROR Model grok-2-latest: Test failed       │ │
│ │              model: grok-2-latest                     │ │
│ │              error: API key lacks permissions         │ │
│ │              latency: 1234                            │ │
│ └───────────────────────────────────────────────────────┘ │
│                                                             │
│ ⚠️ Troubleshooting Tips:                                   │
│    • Verify API endpoint is correct                        │
│    • Check API key has required permissions                │
│    • Ensure selected models are available                  │
│    • Review error details above                            │
├─────────────────────────────────────────────────────────────┤
│ [⚙️ Configure]                            [🖥️ Debug]       │
└─────────────────────────────────────────────────────────────┘
```

## Color Coding

### Log Levels
- **🔵 INFO** (Blue): Normal operational messages
  - Connection attempts
  - Configuration checks
  - API key decryption status

- **🟢 SUCCESS** (Green): Successful operations
  - Successful connections
  - Model tests passed
  - Health checks passed

- **🟡 WARNING** (Yellow): Non-critical issues
  - Missing configuration
  - Fallback behavior activated
  - Incomplete setup

- **🔴 ERROR** (Red): Critical failures
  - Connection failures
  - API errors
  - Model test failures
  - Authentication issues

## Interactive Features

### 📋 Copy Button
- Located in the top-right of debug console
- One-click copy of all logs to clipboard
- Formatted for easy pasting into tickets or emails
- Shows confirmation toast when copied

### Scrollable Log Area
- Maximum height: 192px (12rem)
- Shows last 10 log entries
- Auto-scrolls to most recent
- Dark terminal theme for readability

### Expandable Details
- Each log entry can show additional metadata
- Indented under main message
- Key-value pairs clearly displayed
- JSON objects automatically formatted

## Real-World Example

### Scenario: Invalid API Key

```
17:30:15 INFO  Starting health check
           endpoint: https://api.x.ai/v1
           models: 2

17:30:15 INFO  API key decrypted successfully
           keyLength: 48
           keyPrefix: xai-...

17:30:17 ERROR Connection failed
           error: HTTP 401: Unauthorized
           endpoint: https://api.x.ai/v1/chat/completions
           latency: 1823

⚠️ Troubleshooting Tips:
   • Verify API endpoint is correct
   • Check API key has required permissions
   • Ensure selected models are available
   • Review error details above
```

### Scenario: Model Permission Error

```
17:45:10 INFO  Testing model: grok-2-latest
           model: grok-2-latest
           endpoint: https://api.x.ai/v1

17:45:11 INFO  API key decrypted successfully
           keyLength: 48
           keyPrefix: xai-...

17:45:13 ERROR Model grok-2-latest: Test failed
           model: grok-2-latest
           error: X.AI API Key Permission Error
           latency: 2147

17:45:13 WARNING Model grok-2-latest: Configuration incomplete
           model: grok-2-latest
           issue: Model not available with current API key

⚠️ Troubleshooting Tips:
   • Verify API endpoint is correct
   • Check API key has required permissions
   • Ensure selected models are available
   • Review error details above
```

### Scenario: Network Timeout

```
18:00:05 INFO  Starting health check
           endpoint: https://api.x.ai/v1
           models: 3

18:00:05 INFO  API key decrypted successfully
           keyLength: 48
           keyPrefix: xai-...

18:00:20 ERROR Health check error
           error: Connection test timeout
           stack: Error: Connection test timeout
                  at timeout (debugConsole.ts:245)
                  at ...

⚠️ Troubleshooting Tips:
   • Verify API endpoint is correct
   • Check API key has required permissions
   • Ensure selected models are available
   • Review error details above
```

## When Debug Console Appears

The debug console automatically displays when **ANY** of these conditions are met:

1. ✅ Provider health status is 'unhealthy'
2. ✅ Any model associated with provider has failed
3. ✅ Provider has configuration issues
4. ✅ Health check has generated error logs

## When Debug Console Hides

The debug console automatically hides when:

1. ✅ Provider health status becomes 'healthy'
2. ✅ All models pass their tests
3. ✅ No error logs exist for the provider

**Note**: Historical logs are preserved even when console is hidden, so you can always see what happened if issues occur again.

## Copy Output Format

When you click the "Copy" button, logs are formatted like this:

```
[17:30:15] INFO: Starting health check
endpoint: https://api.x.ai/v1
models: 2

[17:30:15] INFO: API key decrypted successfully
keyLength: 48
keyPrefix: xai-...

[17:30:17] ERROR: Connection failed
error: HTTP 401: Unauthorized
endpoint: https://api.x.ai/v1/chat/completions
latency: 1823
```

Perfect for:
- 📧 Email to support
- 🎫 Ticket creation
- 💬 Slack/Teams messages
- 📋 Documentation
- 🐛 Bug reports

## Best Practices

### For Users
1. **Check console first** before contacting support
2. **Copy logs** before trying to fix issues
3. **Read troubleshooting tips** for quick fixes
4. **Share full context** when reporting issues

### For Administrators
1. **Review logs regularly** to catch issues early
2. **Monitor error patterns** across providers
3. **Use logs for capacity planning**
4. **Document common errors** for team reference

## Privacy & Security

### What's Logged
✅ Timestamps
✅ Error messages
✅ Endpoint URLs
✅ Latency metrics
✅ Configuration status
✅ Model names

### What's NOT Logged
❌ Full API keys (only prefix shown)
❌ Sensitive payload data
❌ User personal information
❌ Authentication tokens
❌ Response content

The debug console is designed to be **safe to share** - sensitive information is automatically redacted.
