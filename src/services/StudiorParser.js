import { format, parse, addDays, isValid } from 'date-fns';

// Simplified parser without AI integration
class StudiorParser {
  static parse(text) {
    const assignments = [];
    const lines = text.split('\n');
    
    // Enhanced patterns
    const patterns = {
      date: /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})|(\w+\s+\d{1,2},?\s+\d{4})|(\d{1,2}\s+\w+\s+\d{4})/gi,
      assignment: /(?:assignment|quiz|exam|test|project|paper|discussion|reading|chapter|video|lab|homework|worksheet|case\s*study|activity|exercise|review|study|complete|submit|turn\s*in|due|HESI|clinical|simulation|vsim|reflection|attestation|remediation|prep)[\s:]*(.+?)(?=\n|$)/gi,
      time: /(\d{1,2}:\d{2}\s*[AaPp][Mm])|(\d{1,2}[AaPp][Mm])|(\d{1,2}:\d{2})/gi,
      points: /(\d+)\s*(?:points?|pts?|%)/gi,
    };
    
    lines.forEach((line, index) => {
      const lowerLine = line.toLowerCase();
      
      // Check for assignment keywords
      if (patterns.assignment.test(lowerLine)) {
        const text = this.cleanText(line);
        if (!text) return;
        
        // Find date
        let date = null;
        for (let i = Math.max(0, index - 3); i <= Math.min(lines.length - 1, index + 3); i++) {
          const dateMatch = lines[i].match(patterns.date);
          if (dateMatch) {
            date = this.parseDate(dateMatch[0]);
            if (date) break;
          }
        }
        
        // Extract time
        const timeMatch = line.match(patterns.time);
        const time = timeMatch ? this.parseTime(timeMatch[0]) : '23:59';
        
        assignments.push({
          title: text,
          date: date || this.getDefaultDate(),
          time,
          type: this.determineType(lowerLine),
          hours: this.estimateHours(lowerLine),
          priority: this.determinePriority(lowerLine),
          description: ''
        });
      }
    });
    
    // Remove duplicates and sort
    return this.deduplicateAndSort(assignments);
  }
  
  static cleanText(text) {
    return text
      .replace(/^[\s\-:•*]+|[\s\-:•*]+$/g, '')
      .replace(/^(due|submit|complete|turn in|assignment|quiz|exam|test)[\s:]+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }
  
  static parseDate(dateStr) {
    const currentYear = new Date().getFullYear();
    const formats = ['MM/dd/yyyy', 'MM-dd-yyyy', 'MMMM d, yyyy', 'MMMM d', 'MM/dd'];
    
    for (const fmt of formats) {
      try {
        let parsed = parse(dateStr, fmt, new Date());
        if (!fmt.includes('yyyy')) parsed.setFullYear(currentYear);
        if (isValid(parsed) && parsed.getFullYear() >= 2024 && parsed.getFullYear() <= 2026) {
          return format(parsed, 'yyyy-MM-dd');
        }
      } catch {}
    }
    return null;
  }
  
  static parseTime(timeStr) {
    try {
      // Handle various formats
      if (/^\d{1,2}:\d{2}$/.test(timeStr)) {
        return timeStr.padStart(5, '0');
      }
      const time = parse(timeStr, 'h:mm a', new Date());
      if (isValid(time)) {
        return format(time, 'HH:mm');
      }
    } catch {}
    return '23:59';
  }
  
  static determineType(text) {
    const types = [
      { pattern: /\b(?:final.*exam|midterm.*exam|hesi.*exam)\b/, type: 'exam' },
      { pattern: /\b(?:clinical.*rotation|clinical)\b/, type: 'clinical' },
      { pattern: /\b(?:simulation|sim(?!ple)|vsim)\b/, type: 'simulation' },
      { pattern: /\b(?:quiz|reflection.*quiz)\b/, type: 'quiz' },
      { pattern: /\b(?:remediation)\b/, type: 'remediation' },
      { pattern: /\b(?:prep|preparation)\b/, type: 'prep' },
      { pattern: /\b(?:project|final.*project)\b/, type: 'project' },
      { pattern: /\b(?:paper|essay|report)\b/, type: 'paper' },
      { pattern: /\b(?:reading|chapter|textbook)\b/, type: 'reading' },
      { pattern: /\b(?:video|watch|view)\b/, type: 'video' },
      { pattern: /\b(?:discussion|forum|post)\b/, type: 'discussion' },
      { pattern: /\b(?:lab|laboratory)\b/, type: 'lab' },
      { pattern: /\b(?:activity|exercise)\b/, type: 'activity' }
    ];
    
    for (const { pattern, type } of types) {
      if (pattern.test(text)) return type;
    }
    return 'assignment';
  }
  
  static estimateHours(text) {
    const type = this.determineType(text);
    const baseHours = {
      'exam': 3,
      'quiz': 1,
      'clinical': 8,
      'simulation': 2,
      'reading': 2,
      'video': 0.5,
      'discussion': 1,
      'lab': 3,
      'project': 6,
      'paper': 4,
      'activity': 1,
      'remediation': 2.5,
      'prep': 2,
      'assignment': 2
    };
    
    let hours = baseHours[type] || 2;
    if (/\b(?:final|comprehensive|major)\b/i.test(text)) {
      hours *= 1.5;
    }
    
    return Math.round(hours * 2) / 2;
  }
  
  static determinePriority(text) {
    if (/\b(?:urgent|asap|immediately)\b/.test(text)) return 'urgent';
    if (/\b(?:final|midterm|hesi.*exam|clinical)\b/.test(text)) return 'high';
    if (/\b(?:exam|test|project|paper|quiz)\b/.test(text)) return 'high';
    if (/\b(?:optional|extra|bonus)\b/.test(text)) return 'low';
    return 'medium';
  }
  
  static deduplicateAndSort(assignments) {
    const seen = new Map();
    
    const unique = assignments.filter(assignment => {
      const key = `${assignment.title.toLowerCase()}-${assignment.date}`;
      if (seen.has(key)) return false;
      seen.set(key, true);
      return true;
    });
    
    return unique.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return dateA - dateB;
    });
  }
  
  static getDefaultDate() {
    return format(addDays(new Date(), 7), 'yyyy-MM-dd');
  }
}

export default StudiorParser;