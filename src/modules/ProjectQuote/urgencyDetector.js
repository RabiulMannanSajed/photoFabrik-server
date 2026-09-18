/**
 * Lightweight, deterministic urgency detector.
 * No external AI — see spec §8: "Do NOT use an external AI API just for this."
 *
 * Returns:
 *   { priority: "urgent"|"normal", reason: string }
 *
 * Matching rules:
 *   - case-insensitive
 *   - whitespace-tolerant
 *   - whole-phrase / whole-word match (avoid false positives like
 *     "asap" inside a longer word)
 *   - shorter phrases are skipped when a longer one already matched
 */
const URGENCY_PHRASES = [
  { phrase: "as soon as possible", weight: 10 },
  { phrase: "needed today", weight: 10 },
  { phrase: "need it today", weight: 10 },
  { phrase: "need this today", weight: 10 },
  { phrase: "by tomorrow", weight: 9 },
  { phrase: "tight deadline", weight: 9 },
  { phrase: "rush project", weight: 9 },
  { phrase: "high priority", weight: 8 },
  { phrase: "deadline", weight: 7 },
  { phrase: "emergency", weight: 7 },
  { phrase: "critical", weight: 7 },
  { phrase: "urgent", weight: 6 },
  { phrase: "urgently", weight: 6 },
  { phrase: "asap", weight: 6 },
  { phrase: "rush", weight: 5 },
  { phrase: "immediately", weight: 6 },
  { phrase: "tomorrow", weight: 5 },
  { phrase: "quickly", weight: 4 },
  { phrase: "very soon", weight: 4 },
  { phrase: "priority", weight: 3 },
  { phrase: "needed", weight: 2 },
];

const STOPWORDS_FOR_MATCH = /[.,!?;:\n\r\t]+/g;

const normalize = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(STOPWORDS_FOR_MATCH, " ")
    .replace(/\s+/g, " ")
    .trim();

const escapeRegex = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * @param {string} projectDescription
 * @returns {{ priority: "urgent"|"normal", reason: string }}
 */
export const detectProjectPriority = (projectDescription = "") => {
  const text = normalize(projectDescription);
  if (!text) return { priority: "normal", reason: "" };

  // Sort by length DESC so "as soon as possible" wins over "asap".
  const sorted = [...URGENCY_PHRASES].sort((a, b) => b.phrase.length - a.phrase.length);

  const hits = [];
  for (const { phrase } of sorted) {
    const re = new RegExp(`\\b${escapeRegex(phrase)}\\b`, "i");
    if (re.test(text)) {
      hits.push(phrase);
      if (hits.length >= 3) break; // cap to keep reason readable
    }
  }

  if (hits.length === 0) {
    return { priority: "normal", reason: "" };
  }

  return {
    priority: "urgent",
    reason: `Urgency detected from project description: ${hits.join(", ")}`,
  };
};
