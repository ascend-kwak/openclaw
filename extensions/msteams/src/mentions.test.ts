import { describe, expect, it } from "vitest";
import { buildMentionEntities, formatMentionText, parseMentions } from "./mentions.js";

describe("parseMentions", () => {
  it("parses single mention", () => {
    const result = parseMentions("Hello @[John Doe](28:xxx-yyy-zzz)!");

    expect(result.text).toBe("Hello <at>John Doe</at>!");
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at>John Doe</at>",
      mentioned: {
        id: "28:xxx-yyy-zzz",
        name: "John Doe",
      },
    });
  });

  it("parses multiple mentions", () => {
    const result = parseMentions("Hey @[Alice](28:aaa) and @[Bob](28:bbb), can you review this?");

    expect(result.text).toBe("Hey <at>Alice</at> and <at>Bob</at>, can you review this?");
    expect(result.entities).toHaveLength(2);
    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at>Alice</at>",
      mentioned: {
        id: "28:aaa",
        name: "Alice",
      },
    });
    expect(result.entities[1]).toEqual({
      type: "mention",
      text: "<at>Bob</at>",
      mentioned: {
        id: "28:bbb",
        name: "Bob",
      },
    });
  });

  it("handles text without mentions", () => {
    const result = parseMentions("Hello world!");

    expect(result.text).toBe("Hello world!");
    expect(result.entities).toHaveLength(0);
  });

  it("handles empty text", () => {
    const result = parseMentions("");

    expect(result.text).toBe("");
    expect(result.entities).toHaveLength(0);
  });

  it("handles mention with spaces in name", () => {
    const result = parseMentions("@[John Peter Smith](28:xxx)");

    expect(result.text).toBe("<at>John Peter Smith</at>");
    expect(result.entities[0]?.mentioned.name).toBe("John Peter Smith");
  });

  it("trims whitespace from id and name", () => {
    const result = parseMentions("@[ John Doe ]( 28:xxx )");

    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at> John Doe </at>",
      mentioned: {
        id: "28:xxx",
        name: "John Doe",
      },
    });
  });
});

describe("buildMentionEntities", () => {
  it("builds entities from mention info", () => {
    const mentions = [
      { id: "28:aaa", name: "Alice" },
      { id: "28:bbb", name: "Bob" },
    ];

    const entities = buildMentionEntities(mentions);

    expect(entities).toHaveLength(2);
    expect(entities[0]).toEqual({
      type: "mention",
      text: "<at>Alice</at>",
      mentioned: {
        id: "28:aaa",
        name: "Alice",
      },
    });
    expect(entities[1]).toEqual({
      type: "mention",
      text: "<at>Bob</at>",
      mentioned: {
        id: "28:bbb",
        name: "Bob",
      },
    });
  });

  it("handles empty list", () => {
    const entities = buildMentionEntities([]);
    expect(entities).toHaveLength(0);
  });
});

describe("formatMentionText", () => {
  it("formats text with single mention", () => {
    const text = "Hello @John!";
    const mentions = [{ id: "28:xxx", name: "John" }];

    const result = formatMentionText(text, mentions);

    expect(result).toBe("Hello <at>John</at>!");
  });

  it("formats text with multiple mentions", () => {
    const text = "Hey @Alice and @Bob";
    const mentions = [
      { id: "28:aaa", name: "Alice" },
      { id: "28:bbb", name: "Bob" },
    ];

    const result = formatMentionText(text, mentions);

    expect(result).toBe("Hey <at>Alice</at> and <at>Bob</at>");
  });

  it("handles case-insensitive matching", () => {
    const text = "Hey @alice and @ALICE";
    const mentions = [{ id: "28:aaa", name: "Alice" }];

    const result = formatMentionText(text, mentions);

    expect(result).toBe("Hey <at>Alice</at> and <at>Alice</at>");
  });

  it("handles text without mentions", () => {
    const text = "Hello world";
    const mentions = [{ id: "28:xxx", name: "John" }];

    const result = formatMentionText(text, mentions);

    expect(result).toBe("Hello world");
  });
});
