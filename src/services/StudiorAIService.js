// src/services/StudiorAIService.js
// Enhanced AI service with systematic extraction prompt - FIXED RESPONSE PARSING

export class StudiorAIService {
  constructor(apiKey, options = {}) {
    this.apiKey = apiKey;
    this.primaryModel = options.model || 'gpt-4o';
    this.fallbackModel = 'gpt-3.5-turbo';
    this.baseURL = 'https://api.openai.com/v1';
    this.timeout = 90000;
    this.maxRetries = 3;

    console.log(`🤖 StudiorAIService initialized: ${this.primaryModel}`);
    console.log('🔑 API Key available:', !!this.apiKey);
  }

  // Single method for consolidating regex results with remainder text
  async consolidateResults(regexAssignments, remainderText, options = {}) {
    const { onProgress } = options;
    onProgress?.({ stage: 'ai-consolidate', message: 'Studiora consolidating all results...' });

    const prompt = this.buildConsolidationPrompt(regexAssignments, remainderText);

    try {
      const result = await this.makeRequest(prompt, this.primaryModel);
      return this.validateResult(result);
    } catch (primaryError) {
      console.warn(`⚠️ Primary model "${this.primaryModel}" failed. Retrying with fallback model "${this.fallbackModel}"...`, primaryError.name, primaryError.message);
      try {
        const result = await this.makeRequest(prompt, this.fallbackModel);
        return this.validateResult(result);
      } catch (fallbackError) {
        console.error('🤖 AI consolidation failed completely:', fallbackError.name, fallbackError.message);
        return {
          assignments: regexAssignments,
          summary: 'Consolidation failed (both models), using regex results only'
        };
      }
    }
  }

  buildConsolidationPrompt(regexAssignments, remainderText) {
    const currentDate = new Date().toISOString().split('T')[0];

    return `SYSTEMATIC ASSIGNMENT EXTRACTION - Be exhaustive, missing assignments hurts students.

CURRENT DATE: ${currentDate}

REGEX FOUND (needs fixing and validation):
${JSON.stringify(regexAssignments.slice(0, 20), null, 2)}
${regexAssignments.length > 20 ? `\n... and ${regexAssignments.length - 20} more` : ''}

FULL COURSE CONTENT (extract ALL actionable items):
${remainderText.substring(0, 20000)}${remainderText.length > 20000 ? '...[truncated]' : ''}

SYSTEMATIC EXTRACTION METHODOLOGY:
1. SCAN EVERY WEEK chronologically (Week 1, Week 2, etc.)
2. EXTRACT EVERY actionable item - anything students must complete
3. IDENTIFY RECURRING PATTERNS - items that appear multiple times are separate assignments
4. DISTINGUISH SIMILAR ITEMS carefully:
   - "HESI Health Assessment Exam (2:00PM)" = exam
   - "HESI Exam Prep: Health Assessment (Due: 1:45PM)" = assignment
   - "Reflection Quiz" appears 5+ times = 5+ separate quizzes
5. INCLUDE ALL TYPES:
   - Numbered quizzes (Quiz 1, Quiz 2, etc.)
   - Reflection quizzes (appear weekly)
   - Attestation/registration tasks
   - HESI specialty exams (timed events)
   - HESI prep assignments (homework before exams)
   - Remediation work (case studies + learning templates)
   - Activities (simulation, escape room, etc.)
   - Final comprehensive exams

CRITICAL PATTERNS TO CATCH:
- "Reflection Quiz" appears multiple times across weeks = multiple separate assignments
- Each week may have its own reflection quiz with different due dates
- HESI exams vs HESI prep assignments are different items
- Remediation comes in pairs: Case Studies + Learning Templates
- Pre/Post simulation quizzes are separate items

QUALITY CHECK - Expected counts for this type of course:
- Quizzes: 10-15 total (numbered + reflection + specialty)
- Exams: 5-8 (HESI specialty + final)
- Assignments: 15-25 (prep work + remediation + activities)

DO NOT add commentary or formatting. Provide ONLY the JSON response:

{
  "assignments": [
    {
      "text": "Complete assignment description",
      "date": "YYYY-MM-DD",
      "type": "quiz|exam|assignment|activity",
      "hours": 1.5,
      "points": 10,
      "source": "StudioraDualParser|RegexDocumentParser",
      "confidence": 0.9
    }
  ],
  "summary": "Fixed X regex items, found Y additional assignments, total Z assignments extracted"
}`;
  }

  async makeRequest(prompt, modelName, options = {}) {
    const { temperature = 0.3 } = options;
    
    for (let attempt = 1; attempt <= this.maxRetries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(`${this.baseURL}/chat/completions`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            model: modelName,
            messages: [
              {
                role: 'system',
                content: 'You are an expert educational content parser specializing in systematic extraction. Extract EVERY actionable item students must complete. Be exhaustive and systematic. Return only valid JSON.'
              },
              {
                role: 'user',
                content: prompt
              }
            ],
            temperature,
            max_tokens: 4000
          }),
          signal: controller.signal
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error = await response.json().catch(() => ({}));
          throw new Error(`API error ${response.status}: ${error.error?.message || 'Unknown error'}`);
        }

        const content = await this.parseWithTimeout(response, 15000);

        if (!content) throw new Error('No content in API response');
        return this.parseJSON(content);
        
      } catch (error) {
        console.warn(`Attempt ${attempt} with "${modelName}" failed:`, error.name, error.message);
        if (attempt === this.maxRetries) throw error;
        await this.delay(Math.pow(2, attempt) * 1000);
      }
    }
  }

  // FIXED: Handle both Chat Completions and Prompt Management API responses
  async parseWithTimeout(response, ms) {
    const timeout = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('JSON parsing timed out')), ms)
    );
    
    const result = await Promise.race([response.json(), timeout]);
    
    // Handle different OpenAI API response formats
    if (result.choices && result.choices[0] && result.choices[0].message) {
      // Standard Chat Completions API format
      return result.choices[0].message.content;
    } else if (result.output_text) {
      // OpenAI Prompt Management API format
      return result.output_text;
    } else if (result.output_parsed) {
      // OpenAI Prompt Management API with parsed output
      return JSON.stringify(result.output_parsed);
    } else if (result.output && Array.isArray(result.output) && result.output[0]) {
      // Alternative Prompt Management format
      return result.output[0].text || result.output[0].content;
    } else {
      console.error('🚨 Unknown API response format:', result);
      throw new Error('Unknown API response format - unable to extract content');
    }
  }

  parseJSON(content) {
    const cleaned = content
      .replace(/^```json\s*/i, '')
      .replace(/^```\s*/i, '')
      .replace(/\s*```$/i, '')
      .trim();
    
    try {
      return JSON.parse(cleaned);
    } catch (error) {
      const match = cleaned.match(/\{[\s\S]*\}/);
      if (match) return JSON.parse(match[0]);
      throw new Error('Failed to parse AI response as JSON');
    }
  }

  validateResult(result) {
    if (!result || typeof result !== 'object') return { assignments: [] };
    
    const assignments = (result.assignments || [])
      .filter(a => a.text && a.text.length > 3)
      .map(a => ({
        ...a,
        id: a.id || `ai_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        date: this.validateDate(a.date),
        type: a.type || 'assignment',
        hours: this.validateHours(a.hours),
        confidence: Math.max(0, Math.min(1, a.confidence || 0.8)),
        source: this.mapSourceForDisplay(a.source)
      }));

    return {
      ...result,
      assignments
    };
  }

  mapSourceForDisplay(source) {
    const sourceMap = {
      'regex-fixed': 'RegexDocumentParser',
      'regex-kept': 'RegexDocumentParser', 
      'ai-found': 'StudioraDualParser',
      'ai': 'StudioraDualParser'
    };
    return sourceMap[source] || 'StudioraDualParser';
  }

  validateDate(dateString) {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return null;
      const year = date.getFullYear();
      if (year < 2024 || year > 2026) return null;
      return date.toISOString().split('T')[0];
    } catch {
      return null;
    }
  }

  validateHours(hours) {
    const h = parseFloat(hours);
    if (isNaN(h)) return 1.5;
    return Math.max(0.25, Math.min(8, h));
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export default StudiorAIService;
