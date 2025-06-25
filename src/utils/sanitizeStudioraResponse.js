export function sanitizeAndParseStudioraResponse(rawText) {
  try {
    if (!rawText) return null;

    // Strip markdown fences and other formatting
    const stripped = rawText
      .replace(/```(?:json)?/gi, '')
      .replace(/```/g, '')
      .replace(/^[>#].*$/gm, '')
      .replace(/^\s*\*/gm, '')
      .trim();

    // Locate JSON array or object
    const firstBrace = stripped.indexOf('{');
    const firstBracket = stripped.indexOf('[');
    let start = -1;
    if (firstBrace === -1) start = firstBracket;
    else if (firstBracket === -1) start = firstBrace;
    else start = Math.min(firstBrace, firstBracket);

    const lastBrace = Math.max(stripped.lastIndexOf('}'), stripped.lastIndexOf(']'));
    if (start === -1 || lastBrace === -1) {
      throw new Error('No JSON structure detected');
    }

    let jsonText = stripped.slice(start, lastBrace + 1);

    // Remove trailing commas
    jsonText = jsonText.replace(/,\s*(\}|\])/g, '$1');

    // Normalize curly quotes
    jsonText = jsonText
      .replace(/[\u2018\u2019]/g, "'")
      .replace(/[\u201C\u201D]/g, '"');

    // Remove newlines for safety
    jsonText = jsonText.replace(/[\r\n]+/g, '');

    return JSON.parse(jsonText);
  } catch (err) {
    console.error('Failed to sanitize Studiora AI response:', err.message);
    return null;
  }
}
