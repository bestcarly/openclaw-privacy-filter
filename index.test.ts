import { describe, expect, it } from "vitest";
import {
  hasSensitiveContent,
  redactMessageForStorage,
  redactText,
  shouldRouteSensitivePrompt,
} from "./src/core.js";

describe("privacy-filter core", () => {
  it("detects default sensitive patterns", () => {
    expect(hasSensitiveContent("email me at user@example.com")).toBe(true);
    expect(hasSensitiveContent("token=sk-abcdefghijklmnopqrstuvwxyz123456")).toBe(true);
    expect(hasSensitiveContent("normal sentence")).toBe(false);
  });

  it("redacts sensitive values from text", () => {
    const input = "Use sk-abcdefghijklmnopqrstuvwxyz123456 and user@example.com";
    const output = redactText(input, { redactionToken: "[MASK]" });
    expect(output).toContain("[MASK]");
    expect(output).not.toContain("sk-abcdefghijklmnopqrstuvwxyz123456");
    expect(output).not.toContain("user@example.com");
  });

  it("redacts nested object fields for transcript storage", () => {
    const message = {
      role: "user",
      content: "contact user@example.com",
      nested: [{ text: "token=sk-abcdefghijklmnopqrstuvwxyz123456" }],
    };
    const redacted = redactMessageForStorage(message, { redactionToken: "PF" });
    expect(redacted.content).toContain("PF");
    expect(redacted.nested[0].text).toContain("PF");
  });

  it("returns secure route override only when prompt is sensitive and override is configured", () => {
    expect(
      shouldRouteSensitivePrompt("password=secret-12345", {
        secureProvider: "ollama",
        secureModel: "llama3.3:8b",
      }),
    ).toEqual({ providerOverride: "ollama", modelOverride: "llama3.3:8b" });

    expect(
      shouldRouteSensitivePrompt("normal prompt", {
        secureProvider: "ollama",
      }),
    ).toBeNull();

    expect(
      shouldRouteSensitivePrompt("password=secret-12345", {
        routeSensitivePrompts: false,
        secureProvider: "ollama",
      }),
    ).toBeNull();
  });
});
