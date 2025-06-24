import React from 'react';
import { X, Calendar, Clock, BookOpen, Edit2, Trash2, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';

function AssignmentDetails({ isOpen, onClose, assignment, course, onEdit, onDelete, onComplete }) {
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
              <span className="detail-label">Status:</span>
              <button 
                className={`completion-toggle ${assignment.completed ? 'completed' : ''}`}
                onClick={() => onComplete(assignment.id)}
              >
                <CheckCircle size={16} />
                {assignment.completed ? 'Completed' : 'Mark Complete'}
              </button>
            </div>

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
                  border: `1px solid ${priorityColors[assignment.priority]}`
                }}
              >
                {assignment.priority.charAt(0).toUpperCase() + assignment.priority.slice(1)}
              </span>
            </div>

            {assignment.completedAt && (
              <div className="detail-row">
                <span className="detail-label">Completed:</span>
                <span className="detail-value">
                  {format(new Date(assignment.completedAt), 'MMM d, yyyy h:mm a')}
                </span>
              </div>
            )}
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

export default AssignmentDetails;