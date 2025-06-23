#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🚀 Adding Assignment CRUD Feature...\n');

// 1. Create AssignmentModal component
const assignmentModalCode = `import React, { useState, useEffect } from 'react';
import { X, Calendar, Clock, BookOpen } from 'lucide-react';

function AssignmentModal({ isOpen, onClose, onSave, assignment = null, courses = [] }) {
  const [formData, setFormData] = useState({
    title: assignment?.title || '',
    description: assignment?.description || '',
    courseId: assignment?.courseId || courses[0]?.id || '',
    type: assignment?.type || 'assignment',
    date: assignment?.date || new Date().toISOString().split('T')[0],
    time: assignment?.time || '23:59',
    hours: assignment?.hours || '2',
    priority: assignment?.priority || 'medium'
  });

  useEffect(() => {
    if (assignment) {
      setFormData({
        title: assignment.title || '',
        description: assignment.description || '',
        courseId: assignment.courseId || courses[0]?.id || '',
        type: assignment.type || 'assignment',
        date: assignment.date || new Date().toISOString().split('T')[0],
        time: assignment.time || '23:59',
        hours: assignment.hours || '2',
        priority: assignment.priority || 'medium'
      });
    }
  }, [assignment, courses]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.title && formData.courseId) {
      onSave({
        ...formData,
        id: assignment?.id || \`assign_\${Date.now()}\`,
        hours: parseFloat(formData.hours) || 2,
        createdAt: assignment?.createdAt || new Date().toISOString()
      });
      onClose();
    }
  };

  const assignmentTypes = [
    { value: 'assignment', label: 'Assignment', icon: '📝' },
    { value: 'exam', label: 'Exam', icon: '📋' },
    { value: 'quiz', label: 'Quiz', icon: '❓' },
    { value: 'reading', label: 'Reading', icon: '📚' },
    { value: 'clinical', label: 'Clinical', icon: '🏥' },
    { value: 'project', label: 'Project', icon: '🎯' },
    { value: 'discussion', label: 'Discussion', icon: '💬' },
    { value: 'lab', label: 'Lab', icon: '🔬' }
  ];

  const priorities = [
    { value: 'low', label: 'Low', color: '#10b981' },
    { value: 'medium', label: 'Medium', color: '#f59e0b' },
    { value: 'high', label: 'High', color: '#ef4444' }
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            <Calendar size={20} />
            {assignment ? 'Edit Assignment' : 'Add New Assignment'}
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="title">Title *</label>
            <input
              id="title"
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="Chapter 5 Reading"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Pages 120-145, focus on nursing interventions..."
              rows="3"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="course">Course *</label>
              <select
                id="course"
                value={formData.courseId}
                onChange={(e) => setFormData({ ...formData, courseId: e.target.value })}
                required
              >
                <option value="">Select Course</option>
                {courses.map(course => (
                  <option key={course.id} value={course.id}>
                    {course.code} - {course.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label htmlFor="type">Type</label>
              <select
                id="type"
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              >
                {assignmentTypes.map(type => (
                  <option key={type.value} value={type.value}>
                    {type.icon} {type.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="date">Due Date *</label>
              <input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="time">Due Time</label>
              <input
                id="time"
                type="time"
                value={formData.time}
                onChange={(e) => setFormData({ ...formData, time: e.target.value })}
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="hours">Est. Hours</label>
              <input
                id="hours"
                type="number"
                value={formData.hours}
                onChange={(e) => setFormData({ ...formData, hours: e.target.value })}
                min="0.5"
                max="24"
                step="0.5"
              />
            </div>

            <div className="form-group">
              <label>Priority</label>
              <div className="priority-selector">
                {priorities.map(priority => (
                  <button
                    key={priority.value}
                    type="button"
                    className={\`priority-option \${formData.priority === priority.value ? 'selected' : ''}\`}
                    style={{ 
                      borderColor: formData.priority === priority.value ? priority.color : '#d1d5db',
                      backgroundColor: formData.priority === priority.value ? priority.color + '20' : 'white'
                    }}
                    onClick={() => setFormData({ ...formData, priority: priority.value })}
                  >
                    {priority.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {assignment ? 'Update' : 'Create'} Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default AssignmentModal;`;

fs.writeFileSync(path.join(process.cwd(), 'src/components/AssignmentModal.jsx'), assignmentModalCode);
console.log('✅ Created AssignmentModal component');

// 2. Create AssignmentDetails component
const assignmentDetailsCode = `import React from 'react';
import { X, Calendar, Clock, BookOpen, Edit2, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

function AssignmentDetails({ isOpen, onClose, assignment, course, onEdit, onDelete }) {
  if (!isOpen || !assignment) return null;

  const typeIcons = {
    assignment: '📝',
    exam: '📋',
    quiz: '❓',
    reading: '📚',
    clinical: '🏥',
    project: '🎯',
    discussion: '💬',
    lab: '🔬'
  };

  const priorityColors = {
    low: '#10b981',
    medium: '#f59e0b',
    high: '#ef4444'
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content assignment-details" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {typeIcons[assignment.type] || '📄'} {assignment.title}
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="assignment-details-body">
          <div className="detail-section">
            <div className="detail-row">
              <span className="detail-label">Course:</span>
              <span className="detail-value" style={{ color: course?.color }}>
                {course?.code} - {course?.name}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Type:</span>
              <span className="detail-value">
                {typeIcons[assignment.type]} {assignment.type.charAt(0).toUpperCase() + assignment.type.slice(1)}
              </span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Due Date:</span>
              <span className="detail-value">
                <Calendar size={16} style={{ display: 'inline', marginRight: '4px' }} />
                {format(new Date(assignment.date), 'MMMM d, yyyy')}
              </span>
            </div>

            {assignment.time && (
              <div className="detail-row">
                <span className="detail-label">Due Time:</span>
                <span className="detail-value">
                  <Clock size={16} style={{ display: 'inline', marginRight: '4px' }} />
                  {assignment.time}
                </span>
              </div>
            )}

            <div className="detail-row">
              <span className="detail-label">Est. Hours:</span>
              <span className="detail-value">{assignment.hours} hours</span>
            </div>

            <div className="detail-row">
              <span className="detail-label">Priority:</span>
              <span 
                className="priority-badge"
                style={{ 
                  backgroundColor: priorityColors[assignment.priority] + '20',
                  color: priorityColors[assignment.priority],
                  border: \`1px solid \${priorityColors[assignment.priority]}\`
                }}
              >
                {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
              </span>
            </div>
          </div>

          {assignment.description && (
            <div className="detail-section">
              <h3>Description</h3>
              <p>{assignment.description}</p>
            </div>
          )}

          <div className="detail-actions">
            <button onClick={onEdit} className="btn btn-primary">
              <Edit2 size={16} />
              Edit Assignment
            </button>
            <button onClick={onDelete} className="btn btn-danger">
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AssignmentDetails;`;

fs.writeFileSync(path.join(process.cwd(), 'src/components/AssignmentDetails.jsx'), assignmentDetailsCode);
console.log('✅ Created AssignmentDetails component');

// 3. Backup and update App.jsx
const appPath = path.join(process.cwd(), 'src/App.jsx');
const backupPath = path.join(process.cwd(), 'src/App.jsx.backup-crud');
fs.copyFileSync(appPath, backupPath);
console.log('✅ Backed up App.jsx');

// 4. Read current App.jsx and update imports
let appContent = fs.readFileSync(appPath, 'utf8');

// Add new imports after CourseModal import
const courseModalImportIndex = appContent.indexOf("import CourseModal from './components/CourseModal'");
const importEndIndex = appContent.indexOf('\n', courseModalImportIndex);
const newImports = `
import AssignmentModal from './components/AssignmentModal'
import AssignmentDetails from './components/AssignmentDetails'`;

appContent = appContent.slice(0, importEndIndex) + newImports + appContent.slice(importEndIndex);

// Add new state variables after existing state
const stateIndex = appContent.indexOf('const [calendarKey, setCalendarKey] = useState(0)');
const stateEndIndex = appContent.indexOf('\n', stateIndex);
const newState = `
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false)`;

appContent = appContent.slice(0, stateEndIndex) + newState + appContent.slice(stateEndIndex);

// Replace handleEventClick function
const eventClickStart = appContent.indexOf('const handleEventClick = (info) => {');
const eventClickEnd = appContent.indexOf('}', appContent.indexOf('Course:', eventClickStart)) + 1;
const newEventClick = `const handleEventClick = (info) => {
    const { event } = info
    const assignment = assignments.find(a => a.id === event.id)
    setSelectedAssignment(assignment)
    setShowAssignmentDetails(true)
  }`;

appContent = appContent.slice(0, eventClickStart) + newEventClick + appContent.slice(eventClickEnd);

// Replace handleDateClick function
const dateClickStart = appContent.indexOf('const handleDateClick = (info) => {');
const dateClickEnd = appContent.indexOf('}', appContent.indexOf('console.log(\'➕ Added assignment:', dateClickStart)) + 1;
const newDateClick = `const handleDateClick = (info) => {
    if (courses.length === 0) {
      alert('Please create a course first!')
      return
    }

    setEditingAssignment({
      date: info.dateStr,
      courseId: selectedCourse === 'all' ? courses[0].id : selectedCourse
    })
    setShowAssignmentModal(true)
  }`;

appContent = appContent.slice(0, dateClickStart) + newDateClick + appContent.slice(dateClickEnd);

// Add new handler functions before the return statement
const returnIndex = appContent.indexOf('return (');
const newHandlers = `
  // Handle assignment save
  const handleAssignmentSave = (assignmentData) => {
    if (editingAssignment?.id) {
      setAssignments(assignments.map(a => a.id === assignmentData.id ? assignmentData : a))
      console.log('✏️ Updated assignment:', assignmentData.title)
    } else {
      setAssignments([...assignments, assignmentData])
      console.log('➕ Added assignment:', assignmentData.title)
    }
    setEditingAssignment(null)
    setCalendarKey(prev => prev + 1)
  }

  // Handle assignment delete
  const handleAssignmentDelete = () => {
    if (selectedAssignment && confirm('Delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== selectedAssignment.id))
      setSelectedAssignment(null)
      setShowAssignmentDetails(false)
      setCalendarKey(prev => prev + 1)
      console.log('🗑️ Deleted assignment')
    }
  }

  // Handle assignment edit
  const handleAssignmentEdit = () => {
    setEditingAssignment(selectedAssignment)
    setShowAssignmentDetails(false)
    setShowAssignmentModal(true)
  }

  `;

appContent = appContent.slice(0, returnIndex) + newHandlers + appContent.slice(returnIndex);

// Add modals before closing div of App
const appClosingIndex = appContent.lastIndexOf('</div>');
const modals = `
      {/* Assignment Modal */}
      <AssignmentModal
        isOpen={showAssignmentModal}
        onClose={() => {
          setShowAssignmentModal(false)
          setEditingAssignment(null)
        }}
        onSave={handleAssignmentSave}
        assignment={editingAssignment}
        courses={courses}
      />

      {/* Assignment Details */}
      <AssignmentDetails
        isOpen={showAssignmentDetails}
        onClose={() => {
          setShowAssignmentDetails(false)
          setSelectedAssignment(null)
        }}
        assignment={selectedAssignment}
        course={courses.find(c => c.id === selectedAssignment?.courseId)}
        onEdit={handleAssignmentEdit}
        onDelete={handleAssignmentDelete}
      />
    `;

appContent = appContent.slice(0, appClosingIndex) + modals + appContent.slice(appClosingIndex);

fs.writeFileSync(appPath, appContent);
console.log('✅ Updated App.jsx with assignment CRUD');

// 5. Add CSS for assignment features
const cssPath = path.join(process.cwd(), 'src/index.css');
const currentCSS = fs.readFileSync(cssPath, 'utf8');

const assignmentCSS = `

/* ========== ASSIGNMENT CRUD STYLES ========== */

/* Form Elements */
.form-group textarea {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-family: inherit;
  resize: vertical;
}

.form-group textarea:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-group select {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

.form-group select:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

/* Priority Selector */
.priority-selector {
  display: flex;
  gap: 0.5rem;
}

.priority-option {
  flex: 1;
  padding: 0.5rem;
  border: 2px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  background: white;
}

.priority-option:hover {
  transform: translateY(-1px);
}

.priority-option.selected {
  font-weight: 600;
}

/* Assignment Details Modal */
.assignment-details {
  max-width: 600px;
}

.assignment-details-body {
  padding: 1.5rem;
}

.detail-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.detail-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.detail-section h3 {
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 0.75rem 0;
  color: #374151;
}

.detail-section p {
  margin: 0;
  color: #4b5563;
  line-height: 1.5;
}

.detail-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
}

.detail-label {
  font-weight: 500;
  color: #6b7280;
  font-size: 0.875rem;
}

.detail-value {
  font-weight: 500;
  color: #1f2937;
  font-size: 0.875rem;
  display: flex;
  align-items: center;
}

.priority-badge {
  padding: 0.25rem 0.75rem;
  border-radius: 9999px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
}

.detail-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
  border-color: #ef4444;
}

.btn-danger:hover {
  background: #dc2626;
  border-color: #dc2626;
}

/* Event Context Menu (for future right-click delete) */
.context-menu {
  position: fixed;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 0.375rem;
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1);
  padding: 0.5rem 0;
  z-index: 1001;
  min-width: 150px;
}

.context-menu-item {
  padding: 0.5rem 1rem;
  font-size: 0.875rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 0.5rem;
  transition: background 0.2s;
}

.context-menu-item:hover {
  background: #f3f4f6;
}

.context-menu-item.danger {
  color: #ef4444;
}

.context-menu-item.danger:hover {
  background: #fee2e2;
}`;

fs.writeFileSync(cssPath, currentCSS + assignmentCSS);
console.log('✅ Added assignment CRUD styles');

console.log('\n🎉 Assignment CRUD Feature Added Successfully!\n');
console.log('What you can now do:');
console.log('  • Click any date to create assignment with full form');
console.log('  • Click any event to view detailed assignment info');
console.log('  • Edit assignments from the details view');
console.log('  • Delete assignments from the details view');
console.log('  • Set priority levels (Low/Medium/High)');
console.log('  • Add descriptions and time estimates\n');
console.log('⚡ Restart your dev server to see the changes!');
console.log('  npm run dev\n');
