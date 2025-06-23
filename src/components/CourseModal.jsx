import React, { useState } from 'react';
import { X, BookOpen } from 'lucide-react';

function CourseModal({ isOpen, onClose, onSave, course = null }) {
  const [formData, setFormData] = useState({
    code: course?.code || '',
    name: course?.name || '',
    color: course?.color || '#3b82f6',
    instructor: course?.instructor || '',
    credits: course?.credits || ''
  });

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (formData.code && formData.name) {
      onSave({
        ...formData,
        id: course?.id || `course_${Date.now()}`,
        createdAt: course?.createdAt || new Date().toISOString()
      });
      onClose();
    }
  };

  const colors = [
    '#3b82f6', // blue
    '#ef4444', // red
    '#10b981', // green
    '#f59e0b', // orange
    '#8b5cf6', // purple
    '#ec4899', // pink
    '#14b8a6', // teal
    '#6366f1', // indigo
  ];

  return (
    <div className="modal-backdrop">
      <div className="modal-content">
        <div className="modal-header">
          <h2 className="modal-title">
            <BookOpen size={20} />
            {course ? 'Edit Course' : 'Add New Course'}
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-group">
            <label htmlFor="code">Course Code *</label>
            <input
              id="code"
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              placeholder="NURS 301"
              required
              maxLength="10"
            />
          </div>

          <div className="form-group">
            <label htmlFor="name">Course Name *</label>
            <input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Adult Health Nursing"
              required
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="instructor">Instructor</label>
              <input
                id="instructor"
                type="text"
                value={formData.instructor}
                onChange={(e) => setFormData({ ...formData, instructor: e.target.value })}
                placeholder="Dr. Smith"
              />
            </div>

            <div className="form-group">
              <label htmlFor="credits">Credits</label>
              <input
                id="credits"
                type="number"
                value={formData.credits}
                onChange={(e) => setFormData({ ...formData, credits: e.target.value })}
                placeholder="3"
                min="0"
                max="12"
              />
            </div>
          </div>

          <div className="form-group">
            <label>Color Theme</label>
            <div className="color-picker">
              {colors.map(color => (
                <button
                  key={color}
                  type="button"
                  className={`color-option ${formData.color === color ? 'selected' : ''}`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  aria-label={`Select ${color}`}
                />
              ))}
            </div>
          </div>

          <div className="modal-actions">
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {course ? 'Update' : 'Create'} Course
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CourseModal;