import { describe, expect, it } from "vitest";
import { buildMentionEntities, formatMentionText, parseMentions } from "./mentions.js";

describe("parseMentions", () => {
  it("parses single mention", () => {
    const result = parseMentions("Hello @[John Doe](28:a1b2c3-d4e5f6)!");

    expect(result.text).toBe("Hello <at>John Doe</at>!");
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at>John Doe</at>",
      mentioned: {
        id: "28:a1b2c3-d4e5f6",
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
    const result = parseMentions("@[John Peter Smith](28:a1b2c3)");

    expect(result.text).toBe("<at>John Peter Smith</at>");
    expect(result.entities[0]?.mentioned.name).toBe("John Peter Smith");
  });

  it("trims whitespace from id and name", () => {
    const result = parseMentions("@[ John Doe ]( 28:a1b2c3 )");

    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at>John Doe</at>",
      mentioned: {
        id: "28:a1b2c3",
        name: "John Doe",
      },
    });
  });

  it("handles Japanese characters in mention at start of message", () => {
    const input = "@[カク ヒョジン](d5318c29-33ac-4e6b-bd42-57b8b793908f) スキル化完了しました！";
    const result = parseMentions(input);

    expect(result.text).toBe("<at>カク ヒョジン</at> スキル化完了しました！");
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]).toEqual({
      type: "mention",
      text: "<at>カク ヒョジン</at>",
      mentioned: {
        id: "d5318c29-33ac-4e6b-bd42-57b8b793908f",
        name: "カク ヒョジン",
      },
    });

    // Verify entity text exactly matches what's in the formatted text
    const entityText = result.entities[0]?.text;
    expect(result.text).toContain(entityText);
    expect(result.text.indexOf(entityText)).toBe(0);
  });

  it("skips mention-like patterns with non-Teams IDs (e.g. in code blocks)", () => {
    // This reproduces the actual failing payload: the message contains a real mention
    // plus `@[表示名](ユーザーID)` as documentation text inside backticks.
    const input =
      "@[カク ヒョジン](d5318c29-33ac-4e6b-bd42-57b8b793908f) スキル化完了しました！📋\n\n" +
      "**作成したスキル:** `teams-mention`\n" +
      "- 機能: Teamsでのメンション形式 `@[表示名](ユーザーID)`\n\n" +
      "**追加対応:**\n" +
      "- カクさんのID `d5318c29-33ac-4e6b-bd42-57b8b793908f` を登録済み";
    const result = parseMentions(input);

    // Only the real mention should be parsed; the documentation example should be left as-is
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]?.mentioned.id).toBe("d5318c29-33ac-4e6b-bd42-57b8b793908f");
    expect(result.entities[0]?.mentioned.name).toBe("カク ヒョジン");

    // The documentation pattern must remain untouched in the text
    expect(result.text).toContain("`@[表示名](ユーザーID)`");
  });

  it("accepts Bot Framework IDs (28:xxx)", () => {
    const result = parseMentions("@[Bot](28:abc-123)");
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]?.mentioned.id).toBe("28:abc-123");
  });

  it("accepts AAD object IDs (UUIDs)", () => {
    const result = parseMentions("@[User](a1b2c3d4-e5f6-7890-abcd-ef1234567890)");
    expect(result.entities).toHaveLength(1);
    expect(result.entities[0]?.mentioned.id).toBe("a1b2c3d4-e5f6-7890-abcd-ef1234567890");
  });

  it("rejects non-ID strings as mention targets", () => {
    const result = parseMentions("See @[docs](https://example.com) for details");
    expect(result.entities).toHaveLength(0);
    // Original text preserved
    expect(result.text).toBe("See @[docs](https://example.com) for details");
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
