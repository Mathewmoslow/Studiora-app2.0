import React, { useState, useEffect, useRef } from 'react';
import { Clock, MapPin, Calendar, CheckCircle, Edit3, Trash2, BookOpen, AlertCircle } from 'lucide-react';

// Event Hover Card Component
export function EventHoverCard({ event, position, onClose, onEdit, onDelete }) {
  const cardRef = useRef(null);
  const [adjustedPosition, setAdjustedPosition] = useState(position);

  useEffect(() => {
    if (cardRef.current) {
      const rect = cardRef.current.getBoundingClientRect();

      let newX = position.x;
      let newY = position.y;

      // Keep within viewport horizontally
      if (newX + rect.width > window.innerWidth - 10) {
        newX = window.innerWidth - rect.width - 10;
      }
      if (newX < 10) {
        newX = 10;
      }

      // And vertically
      if (newY + rect.height > window.innerHeight - 10) {
        newY = window.innerHeight - rect.height - 10;
      }
      if (newY < 10) {
        newY = 10;
      }

      setAdjustedPosition({ x: newX, y: newY });
    }
  }, [position]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (cardRef.current && !cardRef.current.contains(e.target) && !e.target.closest('.fc-event')) {
        onClose();
      }
    };

    // Add slight delay to prevent immediate close on event click
    setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
    }, 100);

    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const getEventTypeIcon = (type) => {
    switch (type) {
      case 'quiz': return '📝';
      case 'exam': return '📚';
      case 'assignment': return '✏️';
      case 'reading': return '📖';
      case 'clinical': return '🏥';
      case 'study': return '📚';
      case 'review': return '🔍';
      default: return '📌';
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div
      ref={cardRef}
      className="event-hover-card"
      style={{
        left: `${adjustedPosition.x}px`,
        top: `${adjustedPosition.y}px`,
      }}
    >
      {/* Header */}
      <div className="hover-card-header">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getEventTypeIcon(event.extendedProps.type)}</span>
          <h3 className="hover-card-title">{event.title}</h3>
        </div>
        <button
          onClick={onClose}
          className="hover-card-close"
        >
          ×
        </button>
      </div>

      {/* Event Details */}
      <div className="hover-card-content">
        {/* Date and Time */}
        <div className="hover-card-detail">
          <Calendar size={14} />
          <span>{new Date(event.start).toLocaleDateString('en-US', {
            weekday: 'short',
            month: 'short',
            day: 'numeric'
          })}</span>
        </div>

        {event.start && !event.allDay && (
          <div className="hover-card-detail">
            <Clock size={14} />
            <span>{new Date(event.start).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true
            })}</span>
          </div>
        )}

        {/* Course Info */}
        {event.extendedProps.courseCode && (
          <div className="hover-card-detail">
            <BookOpen size={14} />
            <span className="font-medium">{event.extendedProps.courseCode}</span>
          </div>
        )}

        {/* Priority */}
        {event.extendedProps.priority && (
          <div className="hover-card-detail">
            <AlertCircle size={14} className={getPriorityColor(event.extendedProps.priority)} />
            <span className={getPriorityColor(event.extendedProps.priority)}>
              {event.extendedProps.priority.charAt(0).toUpperCase() + event.extendedProps.priority.slice(1)} Priority
            </span>
          </div>
        )}

        {/* Hours */}
        {event.extendedProps.hours && (
          <div className="hover-card-detail">
            <Clock size={14} />
            <span>{event.extendedProps.hours} hours estimated</span>
          </div>
        )}

        {/* Description */}
        {event.extendedProps.description && (
          <div className="hover-card-description">
            {event.extendedProps.description}
          </div>
        )}

        {/* Study Block Info */}
        {(event.extendedProps.type === 'study' || event.extendedProps.type === 'review') && (
          <div className="hover-card-study-info">
            <p className="text-sm text-gray-600">
              {event.extendedProps.type === 'review' ? 'Review session' : 'Study block'}
              {event.extendedProps.assignmentTitle && ` for ${event.extendedProps.assignmentTitle}`}
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons - Show for assignments AND study blocks */}
      {(event.extendedProps.isAssignment || event.extendedProps.type === 'study' || event.extendedProps.type === 'review') && (
        <div className="hover-card-actions">
          <button
            onClick={() => onEdit(event)}
            className="hover-card-btn hover-card-btn-primary"
          >
            <Edit3 size={14} />
            Edit
          </button>
          <button
            onClick={() => {
              if (confirm(`Delete this ${event.extendedProps.type || 'item'}?`)) {
                onDelete(event.id);
              }
            }}
            className="hover-card-btn hover-card-btn-danger"
          >
            <Trash2 size={14} />
            Delete
          </button>
        </div>
      )}
    </div>
  );
}

// Hook to manage hover cards
export function useEventHover() {
  const [hoverCard, setHoverCard] = useState(null);
  const hoverTimeout = useRef(null);

  const showHoverCard = (event, position) => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setHoverCard({ event, position });
  };

  const hideHoverCard = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    hoverTimeout.current = setTimeout(() => {
      setHoverCard(null);
    }, 100); // Small delay to prevent flicker when moving between events
  };

  const clearHoverCard = () => {
    if (hoverTimeout.current) {
      clearTimeout(hoverTimeout.current);
    }
    setHoverCard(null);
  };

  return { hoverCard, showHoverCard, hideHoverCard, clearHoverCard };
}

// CSS Styles Component
export const HoverCardStyles = () => (
  <style>{`
    .event-hover-card {
      position: fixed;
      z-index: 9999;
      background: white;
      border-radius: 12px;
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1), 0 6px 12px rgba(0, 0, 0, 0.08);
      border: 1px solid #e5e7eb;
      width: 320px;
      animation: fadeIn 0.2s ease-out;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      pointer-events: none; /* Prevent hover card from interfering with mouse events */
    }
    
    .event-hover-card * {
      pointer-events: auto; /* Re-enable for interactive elements */
    }
    
    /* Ensure hover card is above everything */
    .fc-popover {
      z-index: 9998 !important;
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .hover-card-header {
      padding: 16px;
      border-bottom: 1px solid #e5e7eb;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .hover-card-title {
      font-size: 16px;
      font-weight: 600;
      color: #111827;
      margin: 0;
      flex: 1;
      word-break: break-word;
    }

    .hover-card-close {
      background: none;
      border: none;
      font-size: 24px;
      color: #9ca3af;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    }

    .hover-card-close:hover {
      background: #f3f4f6;
      color: #4b5563;
    }

    .hover-card-content {
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .hover-card-detail {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 14px;
      color: #4b5563;
    }

    .hover-card-detail svg {
      flex-shrink: 0;
    }

    .hover-card-description {
      font-size: 14px;
      color: #6b7280;
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .hover-card-study-info {
      padding: 12px;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid #e5e7eb;
    }

    .hover-card-actions {
      padding: 16px;
      border-top: 1px solid #e5e7eb;
      display: flex;
      gap: 8px;
    }

    .hover-card-btn {
      flex: 1;
      padding: 8px 12px;
      border-radius: 6px;
      border: none;
      font-size: 14px;
      font-weight: 500;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .hover-card-btn-primary {
      background: #3b82f6;
      color: white;
    }

    .hover-card-btn-primary:hover {
      background: #2563eb;
    }

    .hover-card-btn-danger {
      background: #fee2e2;
      color: #dc2626;
    }

    .hover-card-btn-danger:hover {
      background: #fecaca;
    }

    /* FullCalendar event hover effect */
    .fc-event:hover {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transition: all 0.2s;
      cursor: pointer;
    }

    /* Study block styles */
    .study-block {
      background-color: #1f2937 !important;
      border-color: #1f2937 !important;
      color: white !important;
    }

    .review-block {
      background-color: #7c3aed !important;
      border-color: #7c3aed !important;
      color: white !important;
    }

    /* Dark mode support */
    [data-theme="dark"] .event-hover-card {
      background: var(--bg-secondary);
      border-color: var(--border-color);
      box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
    }

    [data-theme="dark"] .hover-card-header {
      border-bottom-color: var(--border-color);
    }

    [data-theme="dark"] .hover-card-title {
      color: var(--text-primary);
    }

    [data-theme="dark"] .hover-card-close {
      color: var(--text-secondary);
    }

    [data-theme="dark"] .hover-card-close:hover {
      background: var(--bg-tertiary);
      color: var(--text-primary);
    }

    [data-theme="dark"] .hover-card-detail {
      color: var(--text-secondary);
    }

    [data-theme="dark"] .hover-card-description,
    [data-theme="dark"] .hover-card-study-info {
      background: var(--bg-tertiary);
      border-color: var(--border-color);
      color: var(--text-secondary);
    }

    [data-theme="dark"] .hover-card-actions {
      border-top-color: var(--border-color);
    }

    /* Responsive adjustments */
    @media (max-width: 640px) {
      .event-hover-card {
        width: 280px;
      }
    }
  `}</style>
);

export default EventHoverCard;