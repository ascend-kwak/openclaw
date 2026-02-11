/**
 * MS Teams mention handling utilities.
 *
 * Mentions in Teams require:
 * 1. Text containing <at>Name</at> tags
 * 2. entities array with mention metadata
 */

export type MentionEntity = {
  type: "mention";
  text: string;
  mentioned: {
    id: string;
    name: string;
  };
};

export type MentionInfo = {
  /** User/bot ID (e.g., "28:xxx" or AAD object ID) */
  id: string;
  /** Display name */
  name: string;
};

/**
 * Parse mentions from text in the format @[Name](id).
 * Example: "Hello @[John Doe](28:xxx-yyy-zzz)!"
 *
 * Returns both the formatted text with <at> tags and the entities array.
 */
export function parseMentions(text: string): {
  text: string;
  entities: MentionEntity[];
} {
  const mentionPattern = /@\[([^\]]+)\]\(([^)]+)\)/g;
  const entities: MentionEntity[] = [];

  // Replace @[Name](id) with <at>Name</at> and collect entities
  const formattedText = text.replace(mentionPattern, (match, name, id) => {
    entities.push({
      type: "mention",
      text: `<at>${name}</at>`,
      mentioned: {
        id: id.trim(),
        name: name.trim(),
      },
    });
    return `<at>${name}</at>`;
  });

  return {
    text: formattedText,
    entities,
  };
}

/**
 * Build mention entities array from a list of mentions.
 * Use this when you already have the mention info and formatted text.
 */
export function buildMentionEntities(mentions: MentionInfo[]): MentionEntity[] {
  return mentions.map((mention) => ({
    type: "mention",
    text: `<at>${mention.name}</at>`,
    mentioned: {
      id: mention.id,
      name: mention.name,
    },
  }));
}

/**
 * Format text with mentions using <at> tags.
 * This is a convenience function when you want to manually format mentions.
 */
export function formatMentionText(text: string, mentions: MentionInfo[]): string {
  let formatted = text;
  for (const mention of mentions) {
    // Replace @Name or @name with <at>Name</at>
    const namePattern = new RegExp(`@${mention.name}`, "gi");
    formatted = formatted.replace(namePattern, `<at>${mention.name}</at>`);
  }
  return formatted;
}
