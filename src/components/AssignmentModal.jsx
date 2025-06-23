import React, { useState, useEffect } from 'react';
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
        id: assignment?.id || `assign_${Date.now()}`,
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
                    className={`priority-option ${formData.priority === priority.value ? 'selected' : ''}`}
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

export default AssignmentModal;