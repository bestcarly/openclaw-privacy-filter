export type PrivacyFilterConfig = {
  enabled?: boolean;
  secureProvider?: string;
  secureModel?: string;
  routeSensitivePrompts?: boolean;
  redactTranscript?: boolean;
  redactOutboundMessages?: boolean;
  redactionToken?: string;
  customPatterns?: string[];
};

export type RouteOverrideResult = {
  providerOverride?: string;
  modelOverride?: string;
};

const DEFAULT_REDACTION_TOKEN = "[REDACTED]";

const BASE_PATTERNS: RegExp[] = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b/g, // email
  /\b1[3-9]\d{9}\b/g, // CN mobile
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/g, // AWS access key id
  /\bsk-[A-Za-z0-9_-]{16,}\b/g, // OpenAI-like token prefix
  /\bghp_[A-Za-z0-9]{30,}\b/g, // GitHub personal token
  /\bBearer\s+[A-Za-z0-9._-]{16,}\b/g, // bearer token
  /\b(?:api[-_ ]?key|token|secret|password)\s*[:=]\s*["']?[^\s"'`;,]{8,}/gi, // key assignment
];

function compileCustomPatterns(customPatterns?: string[]): RegExp[] {
  if (!Array.isArray(customPatterns) || customPatterns.length === 0) {
    return [];
  }
  const compiled: RegExp[] = [];
  for (const pattern of customPatterns) {
    if (typeof pattern !== "string" || pattern.trim().length === 0) {
      continue;
    }
    try {
      compiled.push(new RegExp(pattern, "g"));
    } catch {
      // Invalid custom regex should not crash the plugin.
      continue;
    }
  }
  return compiled;
}

export function hasSensitiveContent(text: string, config?: PrivacyFilterConfig): boolean {
  if (typeof text !== "string" || text.length === 0) {
    return false;
  }
  const patterns = [...BASE_PATTERNS, ...compileCustomPatterns(config?.customPatterns)];
  return patterns.some((pattern) => {
    pattern.lastIndex = 0;
    return pattern.test(text);
  });
}

export function redactText(text: string, config?: PrivacyFilterConfig): string {
  if (typeof text !== "string" || text.length === 0) {
    return text;
  }
  const token =
    typeof config?.redactionToken === "string" && config.redactionToken.trim().length > 0
      ? config.redactionToken
      : DEFAULT_REDACTION_TOKEN;
  const patterns = [...BASE_PATTERNS, ...compileCustomPatterns(config?.customPatterns)];
  let output = text;
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    output = output.replace(pattern, token);
  }
  return output;
}

function redactUnknown(value: unknown, config?: PrivacyFilterConfig): unknown {
  if (typeof value === "string") {
    return redactText(value, config);
  }
  if (Array.isArray(value)) {
    return value.map((item) => redactUnknown(item, config));
  }
  if (!value || typeof value !== "object") {
    return value;
  }
  const record = value as Record<string, unknown>;
  const next: Record<string, unknown> = {};
  for (const [key, val] of Object.entries(record)) {
    next[key] = redactUnknown(val, config);
  }
  return next;
}

export function redactMessageForStorage<T>(message: T, config?: PrivacyFilterConfig): T {
  return redactUnknown(message, config) as T;
}

export function shouldRouteSensitivePrompt(
  prompt: string,
  config?: PrivacyFilterConfig,
): RouteOverrideResult | null {
  if (config?.enabled === false) {
    return null;
  }
  if (config?.routeSensitivePrompts === false) {
    return null;
  }
  if (!hasSensitiveContent(prompt, config)) {
    return null;
  }
  const providerOverride = config?.secureProvider?.trim() || undefined;
  const modelOverride = config?.secureModel?.trim() || undefined;
  if (!providerOverride && !modelOverride) {
    return null;
  }
  return { providerOverride, modelOverride };
}
