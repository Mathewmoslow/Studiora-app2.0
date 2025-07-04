import React, { useState } from 'react';
import { X, Brain, Loader, AlertCircle, CheckCircle } from 'lucide-react';
import OpenAI from 'openai';
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


  const parseWithAI = async (text, courseName) => {
    console.log('[Parser] Starting Studiora AI parsing with API key:', apiKey ? 'Present' : 'Missing');

    if (!apiKey) {
      console.log('[Parser] No API key found in environment, skipping Studiora AI parsing');
      return { assignments: [], events: [], tokenUsage: null };
    }

    updateProgress('ai', 'Studiora is analyzing your content...');

    try {
      const client = new OpenAI({ apiKey });

      const response = await client.responses.create({
        prompt: {
          id: 'pmpt_6867fd7d55408195837431a01c6d01aa0df59ec7a5e95a0b',
          version: '2',
          variables: {
            course: courseName,
            content: text,
          },
        },
        text: { format: { type: 'json_object' } },
      });

      const usage = response.usage || {};
      const cost = usage.total_tokens ? (usage.total_tokens / 1000) * 0.002 : 0;

      const parsed = parseAIResponse(response.output_text);
      updateProgress('ai', `Studiora found ${(parsed.assignments || []).length} assignments (Cost: $${cost.toFixed(4)})`);

      return {
        ...parsed,
        tokenUsage: { ...usage, cost },
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
      const aiResult = await parseWithAI(inputText, selectedCourseData?.name || 'Course');
      const allAssignments = aiResult.assignments || [];
      const tokenUsage = aiResult.tokenUsage;

      updateProgress('ai', `Studiora extracted ${allAssignments.length} assignments`);
      
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
                    Parsing requires an OpenAI API key. Set VITE_OPENAI_API_KEY in your .env file.
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