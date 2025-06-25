/**
 * Utility to parse JSON from AI responses that may include Markdown code blocks.
 * Removes markdown formatting and extracts the JSON portion before parsing.
 */

/**
 * Strip Markdown code fences and trim whitespace.
 * @param {string} text
 * @returns {string}
 */
export function stripMarkdown(text = '') {
  return text
    .replace(/```(?:json)?/gi, '') // remove ```json or ```JSON
    .replace(/```/g, '') // remove remaining ```
    .trim();
}

/**
 * Parse JSON from a possibly markdown-formatted string.
 * @param {string} content
 * @returns {object}
 */
export default function parseAIResponse(content) {
  const cleaned = stripMarkdown(content);

  // Find first opening brace or bracket
  const firstObj = cleaned.indexOf('{');
  const firstArr = cleaned.indexOf('[');
  let start = -1;
  if (firstObj !== -1 && firstArr !== -1) {
    start = Math.min(firstObj, firstArr);
  } else {
    start = firstObj !== -1 ? firstObj : firstArr;
  }
  if (start === -1) {
    throw new Error('No JSON found in AI response');
  }

  // Slice to just the JSON portion
  let jsonString = cleaned.slice(start);
  const endObj = jsonString.lastIndexOf('}');
  const endArr = jsonString.lastIndexOf(']');
  const end = Math.max(endObj, endArr);
  if (end !== -1) {
    jsonString = jsonString.slice(0, end + 1);
  }

  return JSON.parse(jsonString);
}
