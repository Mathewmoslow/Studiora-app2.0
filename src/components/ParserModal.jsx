import React, { useState } from 'react';
import { X, Brain, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import parseAIResponse from '../utils/aiResponseFormatter';

function ParserModal({ isOpen, onClose, onComplete, courses }) {
  const [inputText, setInputText] = useState('');
  const [selectedCourse, setSelectedCourse] = useState(courses[0]?.id || '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [progress, setProgress] = useState([]);
  const [parsedAssignments, setParsedAssignments] = useState([]);
  const [step, setStep] = useState(1);
  
  const apiKey = import.meta.env.VITE_OPENAI_API_KEY;

  if (!isOpen) return null;

  const updateProgress = (stage, message) => {
    console.log(`[Parser Progress] ${stage}: ${message}`);
    setProgress(prev => [...prev, { 
      stage, 
      message, 
      timestamp: new Date().toLocaleTimeString() 
    }]);
  };

  const parseWithRegex = (text) => {
    console.log('[Parser] Starting regex parsing...');
    const assignments = [];
    
    // Pattern for dates
    const datePattern = /(?:January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{1,2}(?:st|nd|rd|th)?(?:,?\s+\d{4})?|\d{1,2}\/\d{1,2}(?:\/\d{2,4})?/gi;
    
    // Pattern for assignment keywords
    const assignmentPattern = /(?:assignment|homework|quiz|test|exam|project|paper|essay|lab|discussion|reading|chapter|module|week\s*\d+|presentation|midterm|final)/gi;
    
    const lines = text.split('\n');
    
    lines.forEach((line, index) => {
      if (assignmentPattern.test(line)) {
        const dates = line.match(datePattern);
        const title = line.trim().substring(0, 100);
        
        if (title.length > 10) {
          const assignment = {
            title: title,
            date: dates ? parseDate(dates[0]) : null,
            type: detectAssignmentType(line),
            hours: estimateHours(line),
            description: ''
          };
          assignments.push(assignment);
          console.log(`[Regex Parser] Line ${index + 1}: "${line.trim()}"`);
          console.log(`[Regex Parser] → Extracted:`, assignment);
        }
      }
    });
    
    console.log(`[Parser] Regex parsing complete. Found ${assignments.length} assignments`);
    console.log('[Parser] Full regex results:', assignments);
    return assignments;
  };

  const parseDate = (dateStr) => {
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
    
    // Try to parse current year
    const currentYear = new Date().getFullYear();
    const dateWithYear = new Date(`${dateStr}, ${currentYear}`);
    if (!isNaN(dateWithYear.getTime())) {
      return dateWithYear.toISOString().split('T')[0];
    }
    
    return null;
  };

  const detectAssignmentType = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('quiz')) return 'quiz';
    if (lower.includes('exam') || lower.includes('test')) return 'exam';
    if (lower.includes('project')) return 'project';
    if (lower.includes('paper') || lower.includes('essay')) return 'paper';
    if (lower.includes('discussion')) return 'discussion';
    if (lower.includes('lab')) return 'lab';
    if (lower.includes('presentation')) return 'presentation';
    if (lower.includes('reading') || lower.includes('chapter')) return 'reading';
    return 'assignment';
  };

  const estimateHours = (text) => {
    const lower = text.toLowerCase();
    if (lower.includes('exam') || lower.includes('midterm') || lower.includes('final')) return 3;
    if (lower.includes('quiz')) return 1;
    if (lower.includes('project') || lower.includes('paper')) return 5;
    if (lower.includes('reading') || lower.includes('chapter')) return 2;
    return 2;
  };

  const parseWithAI = async (text, courseName) => {
    console.log('[Parser] Starting Studiora AI parsing with API key:', apiKey ? 'Present' : 'Missing');
    
    if (!apiKey) {
      console.log('[Parser] No API key found in environment, skipping Studiora AI parsing');
      return { assignments: [], events: [], tokenUsage: null };
    }

    updateProgress('ai', 'Studiora is analyzing your content...');

    try {
      // Estimate tokens (rough estimate: ~4 chars per token)
      const inputTokens = Math.ceil((text.length + 200) / 4); // 200 chars for system prompt
      const estimatedOutputTokens = 500; // typical response size
      const totalTokens = inputTokens + estimatedOutputTokens;
      const costEstimate = (totalTokens / 1000) * 0.002; // GPT-3.5-turbo pricing: $0.002 per 1K tokens
      
      console.log('[Parser] Token estimate:', { inputTokens, estimatedOutputTokens, totalTokens, costEstimate: `$${costEstimate.toFixed(4)}` });

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content: `Extract assignments and events from course content. Return JSON with arrays:
                - assignments: [{title, date, type, hours, description}]
                - events: [{title, date, type, hours, location}]
                Use ISO date format (YYYY-MM-DD). Types: reading, quiz, assignment, project, exam, discussion, paper, presentation, lab, clinical.`
            },
            {
              role: 'user',
              content: `Course: ${courseName}\n\nContent:\n${text}`
            }
          ],
          temperature: 0.3
        })
      });

      console.log('[Parser] Studiora AI Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('[Parser] Studiora AI Error:', errorData);
        throw new Error(errorData.error?.message || `API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Parser] Studiora AI response:', data);
      
      // Extract actual token usage
      const usage = data.usage;
      const actualCost = ((usage?.total_tokens || totalTokens) / 1000) * 0.002;
      
      console.log('[Parser] Actual token usage:', {
        prompt_tokens: usage?.prompt_tokens,
        completion_tokens: usage?.completion_tokens,
        total_tokens: usage?.total_tokens,
        actual_cost: `$${actualCost.toFixed(4)}`
      });
      
      const content = data.choices[0].message.content;
      const parsed = parseAIResponse(content);
      console.log('[Parser] Studiora extracted assignments:', parsed);
      
      updateProgress('ai', `Studiora found ${parsed.assignments?.length || 0} assignments (Cost: $${actualCost.toFixed(4)})`);
      
      return {
        ...parsed,
        tokenUsage: {
          prompt_tokens: usage?.prompt_tokens || inputTokens,
          completion_tokens: usage?.completion_tokens || estimatedOutputTokens,
          total_tokens: usage?.total_tokens || totalTokens,
          cost: actualCost
        }
      };
    } catch (err) {
      console.error('[Parser] Studiora AI parsing error:', err);
      updateProgress('ai', `Studiora AI parsing failed: ${err.message}`);
      return { assignments: [], events: [], tokenUsage: null };
    }
  };

  const handleParse = async () => {
    setIsLoading(true);
    setError('');
    setProgress([]);
    setParsedAssignments([]);

    const selectedCourseData = courses.find(c => c.id === selectedCourse);
    
    try {
      // Step 1: Regex parsing
      updateProgress('regex', 'Studiora is scanning for assignments...');
      const regexAssignments = parseWithRegex(inputText);
      updateProgress('regex', `Studiora found ${regexAssignments.length} potential assignments`);

      // Step 2: AI enhancement (if API key exists)
      let aiAssignments = [];
      let tokenUsage = null;
      if (apiKey) {
        const aiResult = await parseWithAI(inputText, selectedCourseData?.name || 'Course');
        aiAssignments = aiResult.assignments || [];
        tokenUsage = aiResult.tokenUsage;
        updateProgress('ai', `Studiora AI enhanced ${aiAssignments.length} assignments`);
      }

      // Step 3: Merge results (prefer AI results if available)
      const allAssignments = aiAssignments.length > 0 ? aiAssignments : regexAssignments;
      
      console.log('[Parser] Final assignments:', allAssignments);
      updateProgress('merge', `Studiora extracted ${allAssignments.length} total assignments`);
      
      if (tokenUsage) {
        updateProgress('cost', `API usage: ${tokenUsage.total_tokens} tokens ($${tokenUsage.cost.toFixed(4)})`);
      }
      
      if (allAssignments.length === 0) {
        setError('No assignments found. Try different text or check the format.');
      } else {
        setParsedAssignments(allAssignments);
        setStep(2);
      }

    } catch (err) {
      console.error('[Parser] Error:', err);
      setError(err.message);
      updateProgress('error', `Parsing failed: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignToCourse = () => {
    if (selectedCourse && parsedAssignments.length > 0) {
      console.log('[Parser] Assigning', parsedAssignments.length, 'assignments to course:', selectedCourse);
      onComplete(selectedCourse, parsedAssignments);
      onClose();
    }
  };

  const handleClose = () => {
    if (step === 2 && parsedAssignments.length > 0) {
      if (confirm('Are you sure? You will lose the parsed assignments.')) {
        onClose();
      }
    } else {
      onClose();
    }
  };

  return (
    <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}>
      <div className="modal-content parser-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 className="modal-title">
            <Brain size={20} />
            {step === 1 ? 'Import Course Assignments' : 'Assign to Course'}
          </h2>
          <button onClick={handleClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="modal-body">
          {step === 1 ? (
            <>
              <p className="parser-subtitle">
                {step === 1 
                  ? 'Paste your syllabus, course page, or assignment list' 
                  : `${parsedAssignments.length} assignments found - Select a course`}
              </p>

              {/* Course Selection */}
              <div className="form-group">
                <label>Target Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                  disabled={isLoading}
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Content Input */}
              <div className="form-group">
                <label>Course Content</label>
                <textarea
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  placeholder="Paste your syllabus, course page, or assignment list here..."
                  rows="10"
                  disabled={isLoading}
                />
              </div>

              {/* Progress Display */}
              {progress.length > 0 && (
                <div className="parser-progress">
                  <h3>Progress</h3>
                  <div className="progress-list">
                    {progress.map((item, index) => (
                      <div key={index} className="progress-item">
                        {item.stage === 'error' ? (
                          <AlertCircle size={16} style={{color: '#dc2626'}} />
                        ) : item.stage === 'cost' ? (
                          <span>💰</span>
                        ) : isLoading && index === progress.length - 1 ? (
                          <Loader size={16} className="spin" style={{color: '#3b82f6'}} />
                        ) : (
                          <CheckCircle size={16} style={{color: '#10b981'}} />
                        )}
                        <span className={item.stage === 'error' ? 'error-text' : ''}>
                          {item.message}
                        </span>
                        <span className="timestamp">
                          {item.timestamp}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Error Display */}
              {error && (
                <div className="status-message status-error">
                  <AlertCircle size={16} />
                  {error}
                </div>
              )}

              {/* API Key Warning */}
              {!apiKey && (
                <div className="status-message status-warning">
                  <AlertCircle size={16} />
                  <div>
                    <strong>No API Key Found</strong><br />
                    AI enhancement will be skipped. Only regex parsing will be used.
                    Set VITE_OPENAI_API_KEY in your .env file for better results.
                  </div>
                </div>
              )}

              {/* Parse Button */}
              <div className="modal-actions">
                <button
                  onClick={handleParse}
                  disabled={!inputText.trim() || isLoading}
                  className="btn btn-primary"
                >
                  {isLoading ? (
                    <>
                      <Loader size={16} className="spin" />
                      Parsing...
                    </>
                  ) : (
                    <>
                      <Brain size={16} />
                      Parse Assignments
                    </>
                  )}
                </button>
              </div>
            </>
          ) : (
            <>
              {/* Parsed Results */}
              <div className="status-message status-success">
                <CheckCircle size={16} />
                Found {parsedAssignments.length} assignments
              </div>

              <div className="parsed-results">
                <h3>Parsed Assignments</h3>
                <div style={{ maxHeight: '300px', overflowY: 'auto', marginBottom: '1rem' }}>
                  {parsedAssignments.map((assignment, index) => (
                    <div key={index} className="parsed-item">
                      <div className="parsed-item-header">
                        <span className="parsed-item-title">{assignment.title}</span>
                        <span className="parsed-item-date">{assignment.date || 'No date'}</span>
                      </div>
                      <div className="parsed-item-meta">
                        <span className="badge">{assignment.type}</span>
                        <span className="badge">{assignment.hours}h</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Course Selection for Import */}
              <div className="form-group">
                <label>Import to Course</label>
                <select
                  value={selectedCourse}
                  onChange={(e) => setSelectedCourse(e.target.value)}
                >
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.code} - {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Actions */}
              <div className="modal-actions">
                <button
                  onClick={() => setStep(1)}
                  className="btn btn-secondary"
                >
                  Back to Parser
                </button>
                <button
                  onClick={handleAssignToCourse}
                  disabled={!selectedCourse}
                  className="btn btn-primary"
                >
                  Import to {courses.find(c => c.id === selectedCourse)?.code || 'Course'}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export default ParserModal;