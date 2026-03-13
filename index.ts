import type { OpenClawPluginApi } from "openclaw/plugin-sdk";
import {
  hasSensitiveContent,
  redactMessageForStorage,
  redactText,
  shouldRouteSensitivePrompt,
  type PrivacyFilterConfig,
} from "./src/core.js";

function resolveConfig(api: OpenClawPluginApi): PrivacyFilterConfig {
  return (api.pluginConfig ?? {}) as PrivacyFilterConfig;
}

const privacyFilterPlugin = {
  id: "privacy-filter",
  name: "Privacy Filter",
  description: "Best-effort privacy filter for route selection and transcript/outbound redaction.",
  register(api: OpenClawPluginApi) {
    api.on("before_model_resolve", (event) => {
      const config = resolveConfig(api);
      const override = shouldRouteSensitivePrompt(event.prompt, config);
      if (!override) {
        return;
      }
      api.logger.info(
        `privacy-filter: sensitive prompt detected, applying secure route` +
          `${override.providerOverride ? ` provider=${override.providerOverride}` : ""}` +
          `${override.modelOverride ? ` model=${override.modelOverride}` : ""}`,
      );
      return override;
    });

    api.on("before_prompt_build", (event) => {
      const config = resolveConfig(api);
      if (!hasSensitiveContent(event.prompt, config)) {
        return;
      }
      return {
        appendSystemContext:
          "When user content contains secrets or credentials, avoid reproducing them verbatim. " +
          "Use masked placeholders in responses.",
      };
    });

    api.on("before_message_write", (event) => {
      const config = resolveConfig(api);
      if (config.enabled === false || config.redactTranscript === false) {
        return;
      }
      return { message: redactMessageForStorage(event.message, config) };
    });

    api.on("message_sending", (event) => {
      const config = resolveConfig(api);
      if (config.enabled === false || config.redactOutboundMessages !== true) {
        return;
      }
      const nextContent = redactText(event.content, config);
      if (nextContent === event.content) {
        return;
      }
      return { content: nextContent };
    });
  },
};

export default privacyFilterPlugin;
