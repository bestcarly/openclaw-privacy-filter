# Privacy Filter Plugin

`openclaw-privacy-filter` is a best-effort privacy plugin for OpenClaw.

It focuses on three practical controls that are available in the current plugin API:

1. Sensitive prompt routing:
   if a prompt matches sensitive patterns, the plugin can override provider/model to a safer route (for example local provider).
2. Transcript redaction:
   redacts matching strings before session messages are written to JSONL.
3. Outbound message redaction:
   optionally redacts matching strings before final channel messages are sent.

## Limits

This plugin cannot rewrite the full raw LLM request payload in transit.
The current plugin hook surface allows model/provider override and prompt guidance, but not direct mutation of all history payload fields.

For strict in-flight payload replacement/restoration across every turn, core integration (like your privacy branch) is still stronger.

## Configuration

```json
{
  "plugins": {
    "enabled": ["privacy-filter"],
    "privacy-filter": {
      "enabled": true,
      "routeSensitivePrompts": true,
      "secureProvider": "ollama",
      "secureModel": "llama3.3:8b",
      "redactTranscript": true,
      "redactOutboundMessages": false,
      "redactionToken": "[REDACTED]",
      "customPatterns": ["my_secret_[A-Za-z0-9]{10,}"]
    }
  }
}
```

## Pattern coverage

Built-in patterns include:

- email
- CN mobile numbers
- AWS access key id
- `sk-...` token style strings
- `ghp_...` token style strings
- `Bearer ...` auth header style
- `api_key/token/secret/password` assignment style

You can add custom regex sources through `customPatterns`.

## Install

Install from npm:

```bash
openclaw plugins install openclaw-privacy-filter
openclaw plugins enable privacy-filter
```

Install from local path (for development):

```bash
openclaw plugins install ./extensions/privacy-filter
openclaw plugins enable privacy-filter
```

## Publish (independent)

Run from `extensions/privacy-filter`:

```bash
npm publish --access public
```

Tip:
if you want a private or personal namespace, change package name to your own scope first, for example `@your-scope/openclaw-privacy-filter`.
