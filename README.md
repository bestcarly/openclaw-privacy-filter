# OpenClaw Privacy Filter Plugin
<div align="center">
  <img src="./assets/logo.png" alt="Privacy Filter Logo" width="200"/>
</div>

English | [简体中文](./README.zh-CN.md)

A best-effort privacy guard plugin for [OpenClaw](https://github.com/openclaw/openclaw) that provides prompt routing, transcript redaction, and outbound masking.

## Features & Architecture

This plugin hooks into OpenClaw's plugin architecture to provide three main privacy controls:

1. **Sensitive Prompt Routing**
   When a user prompt matches defined sensitive patterns, the plugin dynamically overrides the AI provider and model (e.g., routing the request to a local, secure provider like Ollama).

2. **Transcript Redaction**
   Scans and redacts matching sensitive strings before session messages are written to the persistent local JSONL transcript cache.

3. **Outbound Message Redaction**
   Optionally masks sensitive information in the final messages before they are dispatched to messaging channels (Telegram, Discord, etc.).

### Limitations
This plugin does not provide deep, raw payload replacement at the network layer across history. It uses the officially supported provider and chat hook APIs for content inspection and routing.

## Installation

As this is a standalone OpenClaw plugin, you can install it in two ways.

### Method 1: Install via Archive (Recommended)
1. Download the latest `.tgz` release from the [Releases](https://github.com/bestcarly/openclaw-privacy-filter/releases) page of this repository.
2. Install it via the OpenClaw CLI:
   ```bash
   openclaw plugins install ./path/to/openclaw-privacy-filter-0.1.0.tgz
   openclaw plugins enable privacy-filter
   ```

### Method 2: Install via Local Link (For Developers)
Clone this repository and link it directly:
```bash
git clone https://github.com/bestcarly/openclaw-privacy-filter.git
cd openclaw-privacy-filter
openclaw plugins install -l .
openclaw plugins enable privacy-filter
```

## Configuration

After enabling the plugin, update your `openclaw` configuration file to customize the privacy settings.

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

### Supported Redaction Patterns
By default, the plugin automatically detects and intercepts:
- Email addresses
- Chinese mobile numbers
- AWS access key IDs
- API keys (e.g., `sk-...`, `ghp_...`)
- Bearer tokens
- Common secret assignments (`password=`, `api_key=`, etc.)

You can expand this list by providing custom JavaScript regex source strings in the `customPatterns` configuration array.

## License
MIT License
