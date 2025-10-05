// utils/mentions.ts
export type MentionEntity = {
  start: number; // index of '@'
  end: number; // end of username (exclusive)
  trigger: "@" | "#";
  username: string;
};

const escapeReg = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export function extractConfirmedMentions(
  text: string,
  usernames: string[]
): MentionEntity[] {
  if (!usernames.length || !text) return [];
  // Build a regex like: (^) or whitespace + (@|#) + (Rahulkumar|Rahulsingh|...)
  const group = usernames.map(escapeReg).join("|");
  const re = new RegExp(`(^|\\s)([@#])(${group})\\b`, "gi");

  const out: MentionEntity[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    const prefixLen = m[1].length;
    const atIndex = m.index + prefixLen; // '@' position
    const trigger = m[2] as "@" | "#";
    const username = m[3];
    const end = atIndex + trigger.length + username.length; // exclude trailing space
    out.push({ start: atIndex, end, trigger, username });
  }
  return out;
}
