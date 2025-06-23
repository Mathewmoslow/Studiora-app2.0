#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

console.log('🚀 Adding Course Management Feature...\n');

// 1. Create components directory
const componentsDir = path.join(process.cwd(), 'src/components');
if (!fs.existsSync(componentsDir)) {
  fs.mkdirSync(componentsDir, { recursive: true });
  console.log('✅ Created src/components directory');
}

// 2. Create CourseModal component
const courseModalCode = `import React, { useState } from 'react';
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
        id: course?.id || \`course_\${Date.now()}\`,
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
                  className={\`color-option \${formData.color === color ? 'selected' : ''}\`}
                  style={{ backgroundColor: color }}
                  onClick={() => setFormData({ ...formData, color })}
                  aria-label={\`Select \${color}\`}
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

export default CourseModal;`;

fs.writeFileSync(path.join(componentsDir, 'CourseModal.jsx'), courseModalCode);
console.log('✅ Created CourseModal component');

// 3. Backup current App.jsx
const appPath = path.join(process.cwd(), 'src/App.jsx');
const backupPath = path.join(process.cwd(), 'src/App.jsx.backup');
fs.copyFileSync(appPath, backupPath);
console.log('✅ Backed up App.jsx to App.jsx.backup');

// 4. Update App.jsx with course management
const updatedAppCode = `import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar, Plus, Settings, BookOpen, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import CourseModal from './components/CourseModal'

function App() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [calendarKey, setCalendarKey] = useState(0)

  // Initialize with test data
  useEffect(() => {
    const testCourses = [
      {
        id: 'course_1',
        code: 'NURS 301',
        name: 'Adult Health Nursing',
        color: '#3b82f6',
        instructor: 'Dr. Smith',
        credits: '4'
      },
      {
        id: 'course_2',
        code: 'NURS 302',
        name: 'Pediatric Nursing',
        color: '#10b981',
        instructor: 'Dr. Johnson',
        credits: '3'
      }
    ]
    
    const testAssignments = [
      {
        id: 'assign_1',
        courseId: 'course_1',
        title: 'Chapter 5 Reading',
        date: '2025-06-25',
        type: 'reading',
        hours: 2
      },
      {
        id: 'assign_2',
        courseId: 'course_1',
        title: 'Module 3 Quiz',
        date: '2025-06-27',
        type: 'quiz',
        hours: 1
      },
      {
        id: 'assign_3',
        courseId: 'course_2',
        title: 'Clinical Rotation',
        date: '2025-06-28',
        type: 'clinical',
        hours: 8
      },
      {
        id: 'assign_4',
        courseId: 'course_1',
        title: 'Midterm Exam',
        date: '2025-07-02',
        type: 'exam',
        hours: 3
      }
    ]

    setCourses(testCourses)
    setAssignments(testAssignments)
    console.log('📚 Initialized with test courses and assignments')
  }, [])

  // Filter assignments by selected course
  const filteredAssignments = selectedCourse === 'all' 
    ? assignments 
    : assignments.filter(a => a.courseId === selectedCourse)

  // Convert assignments to FullCalendar events
  const calendarEvents = filteredAssignments.map(assignment => {
    const course = courses.find(c => c.id === assignment.courseId)
    return {
      id: assignment.id,
      title: \`[\${course?.code || 'Unknown'}] \${assignment.title}\`,
      date: assignment.date,
      backgroundColor: course?.color || '#6b7280',
      borderColor: course?.color || '#6b7280',
      extendedProps: {
        type: assignment.type,
        hours: assignment.hours,
        courseCode: course?.code || 'Unknown',
        courseId: assignment.courseId
      }
    }
  })

  // Handle course save
  const handleCourseSave = (courseData) => {
    if (editingCourse) {
      setCourses(courses.map(c => c.id === courseData.id ? courseData : c))
      console.log('✏️ Updated course:', courseData.code)
    } else {
      setCourses([...courses, courseData])
      console.log('➕ Added new course:', courseData.code)
    }
    setEditingCourse(null)
    setCalendarKey(prev => prev + 1)
  }

  // Handle course delete
  const handleCourseDelete = (courseId) => {
    if (confirm('Delete this course and all its assignments?')) {
      setCourses(courses.filter(c => c.id !== courseId))
      setAssignments(assignments.filter(a => a.courseId !== courseId))
      if (selectedCourse === courseId) {
        setSelectedCourse('all')
      }
      setCalendarKey(prev => prev + 1)
      console.log('🗑️ Deleted course:', courseId)
    }
  }

  // Handle event click
  const handleEventClick = (info) => {
    const { event } = info
    console.log('📅 Event clicked:', event.title)
    
    alert(\`Assignment: \${event.title}
Date: \${format(event.start, 'MMMM d, yyyy')}
Type: \${event.extendedProps.type}
Hours: \${event.extendedProps.hours}
Course: \${event.extendedProps.courseCode}\`)
  }

  // Handle date click
  const handleDateClick = (info) => {
    if (courses.length === 0) {
      alert('Please create a course first!')
      return
    }

    const title = prompt('Enter assignment title:')
    if (title) {
      const courseId = selectedCourse === 'all' ? courses[0].id : selectedCourse
      const newAssignment = {
        id: \`assign_\${Date.now()}\`,
        courseId,
        title,
        date: info.dateStr,
        type: 'assignment',
        hours: 2
      }
      setAssignments([...assignments, newAssignment])
      setCalendarKey(prev => prev + 1)
      console.log('➕ Added assignment:', title)
    }
  }

  // Calculate stats
  const stats = {
    totalAssignments: filteredAssignments.length,
    upcomingWeek: filteredAssignments.filter(a => {
      const assignDate = new Date(a.date)
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return assignDate >= new Date() && assignDate <= weekFromNow
    }).length,
    totalHours: filteredAssignments.reduce((sum, a) => sum + a.hours, 0),
    courses: courses.length
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <BookOpen size={24} />
            Studiora Calendar
          </div>
          <div className="header-actions">
            <button className="btn">
              <Settings size={16} />
              Settings
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => {
                setEditingCourse(null)
                setShowCourseModal(true)
              }}
            >
              <Plus size={16} />
              Add Course
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {/* Course Selector */}
        <div className="course-selector">
          <label>View Course:</label>
          <select 
            value={selectedCourse} 
            onChange={(e) => setSelectedCourse(e.target.value)}
            className="course-select"
          >
            <option value="all">All Courses</option>
            {courses.map(course => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.name}
              </option>
            ))}
          </select>
        </div>

        {/* Course List */}
        {courses.length > 0 && (
          <div className="course-list">
            <h3>Your Courses</h3>
            <div className="course-grid">
              {courses.map(course => (
                <div key={course.id} className="course-card" style={{ borderColor: course.color }}>
                  <div className="course-header">
                    <div>
                      <h4>{course.code}</h4>
                      <p>{course.name}</p>
                      {course.instructor && <p className="course-meta">Instructor: {course.instructor}</p>}
                      {course.credits && <p className="course-meta">{course.credits} credits</p>}
                    </div>
                    <div className="course-color" style={{ backgroundColor: course.color }} />
                  </div>
                  <div className="course-actions">
                    <button 
                      className="btn-icon"
                      onClick={() => {
                        setEditingCourse(course)
                        setShowCourseModal(true)
                      }}
                    >
                      <Edit2 size={16} />
                    </button>
                    <button 
                      className="btn-icon btn-icon-danger"
                      onClick={() => handleCourseDelete(course.id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stats */}
        <div className="stats-section">
          <div className="stat-card">
            <div className="stat-value">{stats.totalAssignments}</div>
            <div className="stat-label">
              {selectedCourse === 'all' ? 'Total' : 'Course'} Assignments
            </div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.upcomingWeek}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalHours}h</div>
            <div className="stat-label">Study Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.courses}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>

        {/* Calendar */}
        <div className="calendar-wrapper">
          <div className="calendar-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.name || 'Course'} Calendar
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Click a date to add assignment
            </div>
          </div>
          
          <div className="calendar-container">
            <FullCalendar
              key={calendarKey}
              plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
              initialView="dayGridMonth"
              headerToolbar={{
                left: 'prev,next today',
                center: 'title',
                right: 'dayGridMonth,timeGridWeek'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              height="100%"
              eventClassNames={(arg) => \`event-\${arg.event.extendedProps.type}\`}
            />
          </div>
        </div>
      </main>

      {/* Course Modal */}
      <CourseModal
        isOpen={showCourseModal}
        onClose={() => {
          setShowCourseModal(false)
          setEditingCourse(null)
        }}
        onSave={handleCourseSave}
        course={editingCourse}
      />
    </div>
  )
}

export default App`;

fs.writeFileSync(appPath, updatedAppCode);
console.log('✅ Updated App.jsx with course management');

// 5. Add CSS for course management
const cssPath = path.join(process.cwd(), 'src/index.css');
const currentCSS = fs.readFileSync(cssPath, 'utf8');

// Check if course CSS already exists
if (!currentCSS.includes('Course Selector')) {
  const courseCSS = `

/* ========== COURSE MANAGEMENT STYLES ========== */

/* Course Selector */
.course-selector {
  margin-bottom: 1.5rem;
  display: flex;
  align-items: center;
  gap: 1rem;
}

.course-selector label {
  font-weight: 600;
  color: #374151;
}

.course-select {
  padding: 0.5rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  min-width: 200px;
}

/* Course List */
.course-list {
  background: white;
  padding: 1.5rem;
  border-radius: 0.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  margin-bottom: 2rem;
}

.course-list h3 {
  margin: 0 0 1rem 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.course-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1rem;
}

.course-card {
  border: 2px solid;
  border-radius: 0.5rem;
  padding: 1rem;
  background: white;
  position: relative;
}

.course-header {
  display: flex;
  justify-content: space-between;
  align-items: start;
}

.course-card h4 {
  margin: 0;
  font-size: 1rem;
  font-weight: 600;
}

.course-card p {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.course-meta {
  font-size: 0.75rem !important;
  color: #9ca3af !important;
}

.course-color {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  flex-shrink: 0;
}

.course-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 1rem;
}

.btn-icon {
  padding: 0.375rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.375rem;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-icon:hover {
  background: #f3f4f6;
}

.btn-icon-danger:hover {
  background: #fee2e2;
  border-color: #f87171;
  color: #dc2626;
}

/* Modal Styles */
.modal-backdrop {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 0.5rem;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.modal-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.modal-close {
  padding: 0.25rem;
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  border-radius: 0.25rem;
}

.modal-close:hover {
  background: #f3f4f6;
  color: #1f2937;
}

.modal-form {
  padding: 1.5rem;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input {
  width: 100%;
  padding: 0.5rem 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  font-size: 0.875rem;
}

.form-group input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-row {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 1rem;
}

.color-picker {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.color-option {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: all 0.2s;
}

.color-option:hover {
  transform: scale(1.1);
}

.color-option.selected {
  border-color: #1f2937;
  box-shadow: 0 0 0 2px white, 0 0 0 4px #1f2937;
}

.modal-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.5rem;
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #d1d5db;
}

.btn-secondary:hover {
  background: #f9fafb;
}`;

  fs.writeFileSync(cssPath, currentCSS + courseCSS);
  console.log('✅ Added course management CSS');
} else {
  console.log('ℹ️  Course CSS already exists');
}

console.log('\n🎉 Course Management Feature Added Successfully!\n');
console.log('What you can now do:');
console.log('  • Click "Add Course" to create new courses');
console.log('  • Edit courses with the edit button');  
console.log('  • Delete courses with the trash button');
console.log('  • Filter calendar by course');
console.log('  • Each course has its own color\n');
console.log('⚡ Restart your dev server to see the changes!');
console.log('  npm run dev\n');
