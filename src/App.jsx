import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar, Plus, Settings, BookOpen, Edit2, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import CourseModal from './components/CourseModal'
import AssignmentModal from './components/AssignmentModal'
import AssignmentDetails from './components/AssignmentDetails'
import DataManager from './utils/DataManager'
import SettingsModal from './components/SettingsModal'
import StudySchedulerPanel from './components/StudySchedulerPanel'
import { FileText } from 'lucide-react'
import ParserModal from './components/ParserModal'
import { EventHoverCard, useEventHover, HoverCardStyles } from './components/EventHoverCard'

function App() {
  const [assignments, setAssignments] = useState([])
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('all')
  const [showCourseModal, setShowCourseModal] = useState(false)
  const [editingCourse, setEditingCourse] = useState(null)
  const [calendarKey, setCalendarKey] = useState(0)
  const [showAssignmentModal, setShowAssignmentModal] = useState(false)
  const [editingAssignment, setEditingAssignment] = useState(null)
  const [selectedAssignment, setSelectedAssignment] = useState(null)
  const [showAssignmentDetails, setShowAssignmentDetails] = useState(false)
  const [showSettingsModal, setShowSettingsModal] = useState(false)
  const [studyBlocks, setStudyBlocks] = useState([])
  const [showScheduler, setShowScheduler] = useState(true)
  const [showParserModal, setShowParserModal] = useState(false)
  
  // Add hover management
  const { hoverCard, showHoverCard, hideHoverCard, clearHoverCard } = useEventHover();

  // Load saved data or initialize with defaults
  useEffect(() => {
    const savedData = DataManager.loadAllData();
    if (savedData.courses.length > 0 || savedData.assignments.length > 0) {
      setCourses(savedData.courses);
      setAssignments(savedData.assignments);
      console.log('📂 Loaded saved data:', {
        courses: savedData.courses.length,
        assignments: savedData.assignments.length
      });
    } else {
      // Use test data only if no saved data exists
      const testCourses = [
        {
          id: 'course_1',
          code: 'NURS 301',
          name: 'Adult Health Nursing',
          color: '#3b82f6',
          instructor: 'Dr. Smith',
          credits: '4',
          priority: 1
        },
        {
          id: 'course_2',
          code: 'NURS 302',
          name: 'Pediatric Nursing',
          color: '#10b981',
          instructor: 'Dr. Johnson',
          credits: '3',
          priority: 2
        }
      ]
      const testAssignments = [
        {
          id: 'assign_1',
          courseId: 'course_1',
          title: 'Chapter 5 Reading',
          description: 'Read pages 120-145, focus on nursing interventions',
          date: '2025-06-25',
          time: '23:59',
          type: 'reading',
          hours: 2,
          priority: 'medium',
          completed: false
        },
        {
          id: 'assign_2',
          courseId: 'course_1',
          title: 'Module 3 Quiz',
          description: 'Online quiz covering chapters 4-6',
          date: '2025-06-27',
          time: '14:00',
          type: 'quiz',
          hours: 1,
          priority: 'high',
          completed: false
        },
        {
          id: 'assign_3',
          courseId: 'course_2',
          title: 'Clinical Rotation',
          description: 'Pediatric ward - Building A, 3rd floor',
          date: '2025-06-28',
          time: '07:00',
          type: 'clinical',
          hours: 8,
          priority: 'high',
          completed: false
        },
        {
          id: 'assign_4',
          courseId: 'course_1',
          title: 'Midterm Exam',
          date: '2025-07-02',
          time: '10:00',
          type: 'exam',
          hours: 3,
          priority: 'high',
          completed: false
        }
      ]
      setCourses(testCourses);
      setAssignments(testAssignments);
      console.log('📚 Initialized with test data');
    }
  }, [])

  // Auto-save effect
  useEffect(() => {
    if (courses.length > 0 || assignments.length > 0) {
      DataManager.saveAllData(courses, assignments);
    }
  }, [courses, assignments])

  // Filter assignments by selected course
  const filteredAssignments = selectedCourse === 'all'
    ? assignments
    : assignments.filter(a => a.courseId === selectedCourse)

  // Convert assignments to FullCalendar events and add study blocks
  const calendarEvents = [
    // Assignment events
    ...filteredAssignments.map(assignment => {
      const course = courses.find(c => c.id === assignment.courseId)
      return {
        id: assignment.id,
        title: `[${course?.code || 'Unknown'}] ${assignment.title}`,
        date: assignment.date,
        backgroundColor: course?.color || '#6b7280',
        borderColor: course?.color || '#6b7280',
        extendedProps: {
          type: assignment.type,
          hours: assignment.hours,
          courseCode: course?.code || 'Unknown',
          courseId: assignment.courseId,
          priority: assignment.priority || 'medium',
          isAssignment: true,
          description: assignment.description,
          assignmentTitle: assignment.title // Added for study blocks
        }
      }
    }),
    // Study blocks with enhanced props
    ...studyBlocks.map(block => {
      const assignment = assignments.find(a => a.id === block.extendedProps.assignmentId);
      const course = courses.find(c => c.id === block.extendedProps.courseId);
      return {
        ...block,
        className: block.type === 'review' ? 'review-block' : 'study-block',
        extendedProps: {
          ...block.extendedProps,
          assignmentTitle: assignment?.title || 'Study Session',
          courseCode: course?.code || 'Unknown'
        }
      };
    })
  ]

  // Fixed schedule events (removed as they're not referenced elsewhere)

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

  // Enhanced event click handler
  const handleEventClick = (info) => {
    clearHoverCard(); // Clear hover on click
    const { event } = info;
    
    if (event.extendedProps.isAssignment) {
      const assignment = assignments.find(a => a.id === event.id);
      setSelectedAssignment(assignment);
      setShowAssignmentDetails(true);
    }
  };

  // Add hover handlers
  const handleEventMouseEnter = (info) => {
    const rect = info.el.getBoundingClientRect();
    showHoverCard(info.event, {
      x: rect.right + 10,
      y: rect.top
    });
  };

  const handleEventMouseLeave = () => {
    hideHoverCard();
  };

  // Handle date click
  const handleDateClick = (info) => {
    if (courses.length === 0) {
      alert('Please create a course first!')
      return
    }
    setEditingAssignment({
      date: info.dateStr,
      courseId: selectedCourse === 'all' ? courses[0].id : selectedCourse
    })
    setShowAssignmentModal(true)
  }

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

    if (studyBlocks.length > 0) {
      if (confirm('Assignment updated. Would you like to regenerate the study schedule?')) {
        setStudyBlocks([])
      }
    }
  }

  // Handle assignment delete
  const handleAssignmentDelete = () => {
    if (selectedAssignment && confirm('Delete this assignment?')) {
      setAssignments(assignments.filter(a => a.id !== selectedAssignment.id))
      setSelectedAssignment(null)
      setShowAssignmentDetails(false)
      setCalendarKey(prev => prev + 1)
      console.log('🗑️ Deleted assignment')
      
      if (studyBlocks.length > 0) {
        const updatedBlocks = studyBlocks.filter(
          block => block.extendedProps.assignmentId !== selectedAssignment.id
        )
        setStudyBlocks(updatedBlocks)
      }
    }
  }

  // Handle assignment edit
  const handleAssignmentEdit = () => {
    setEditingAssignment(selectedAssignment)
    setShowAssignmentDetails(false)
    setShowAssignmentModal(true)
  }

  // Handle schedule generated
  const handleScheduleGenerated = (blocks) => {
    setStudyBlocks(blocks)
    setCalendarKey(prev => prev + 1)
    const totalHours = blocks.reduce((sum, block) => sum + block.extendedProps.hours, 0)
    console.log(`📚 Generated ${blocks.length} study blocks totaling ${totalHours.toFixed(1)} hours`)
  }

  // Handle data import
  const handleDataImport = (importedData) => {
    setCourses(importedData.courses)
    setAssignments(importedData.assignments)
    setCalendarKey(prev => prev + 1)
    setStudyBlocks([])
    console.log('📥 Imported data:', {
      courses: importedData.courses.length,
      assignments: importedData.assignments.length
    })
  }

  // Handle clear data
  const handleClearData = () => {
    setCourses([])
    setAssignments([])
    setSelectedCourse('all')
    setStudyBlocks([])
    setCalendarKey(prev => prev + 1)
    window.location.reload()
  }

  // Handle parser import - FIXED
  const handleParserImport = (courseId, parsedAssignments) => {
    // Generate unique IDs for each assignment
    const newAssignments = parsedAssignments.map(assignment => ({
      ...assignment,
      id: `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      courseId: courseId,
      completed: false
    }));
    
    setAssignments([...assignments, ...newAssignments]);
    setCalendarKey(prev => prev + 1);
    console.log('📝 Imported', newAssignments.length, 'assignments from parser for course:', courseId);
    
    // Close modal and show success
    setShowParserModal(false);
    
    // If this course isn't selected, switch to it
    if (selectedCourse !== courseId && selectedCourse !== 'all') {
      setSelectedCourse(courseId);
    }
  }

  // Calculate stats
  const stats = {
    totalAssignments: filteredAssignments.length,
    completedAssignments: filteredAssignments.filter(a => a.completed).length,
    upcomingWeek: filteredAssignments.filter(a => {
      const assignDate = new Date(a.date)
      const weekFromNow = new Date()
      weekFromNow.setDate(weekFromNow.getDate() + 7)
      return assignDate >= new Date() && assignDate <= weekFromNow && !a.completed
    }).length,
    totalHours: filteredAssignments.reduce((sum, a) => sum + (a.hours || 0), 0),
    studyHours: studyBlocks.reduce((sum, block) => sum + block.extendedProps.hours, 0),
    courses: courses.length
  }

  return (
    <div className="app">
      <HoverCardStyles />
      
      {/* Header */}
      <header className="app-header">
        <div className="header-content">
          <div className="app-title">
            <BookOpen size={24} />
            Studiora Calendar
          </div>
          <div className="header-actions">
            <button
              className="btn"
              onClick={() => setShowParserModal(true)}
              disabled={courses.length === 0}
              title={courses.length === 0 ? 'Create a course first' : 'Import syllabus'}
            >
              <FileText size={16} />
              Import Syllabus
            </button>
            <button
              className="btn"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings size={16} />
              Settings
            </button>
            <button
              className="btn"
              onClick={() => {
                setEditingAssignment(null)
                setShowAssignmentModal(true)
              }}
              disabled={courses.length === 0}
            >
              <Plus size={16} />
              Add Assignment
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
            <div className="stat-value">{stats.completedAssignments}</div>
            <div className="stat-label">Completed</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.upcomingWeek}</div>
            <div className="stat-label">Due This Week</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.totalHours}h</div>
            <div className="stat-label">Assignment Hours</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.studyHours.toFixed(1)}h</div>
            <div className="stat-label">Study Scheduled</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{stats.courses}</div>
            <div className="stat-label">Active Courses</div>
          </div>
        </div>

        {/* Study Scheduler */}
        {showScheduler && assignments.length > 0 && (
          <StudySchedulerPanel
            assignments={filteredAssignments}
            courses={courses}
            calendarEvents={calendarEvents.filter(e => e.extendedProps?.type !== 'study' && e.extendedProps?.type !== 'review')}
            onScheduleGenerated={handleScheduleGenerated}
          />
        )}

        {/* Calendar */}
        <div className="calendar-wrapper">
          <div className="calendar-header">
            <h2 style={{ fontSize: '1.25rem', fontWeight: '600' }}>
              {selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.name || 'Course'} Calendar
            </h2>
            <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
              Hover over events for details • Click to view/edit • Black blocks are study time
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
                right: 'dayGridMonth,timeGridWeek,timeGridDay'
              }}
              events={calendarEvents}
              eventClick={handleEventClick}
              eventMouseEnter={handleEventMouseEnter}
              eventMouseLeave={handleEventMouseLeave}
              dateClick={handleDateClick}
              editable={true}
              selectable={true}
              selectMirror={true}
              dayMaxEvents={3}
              weekends={true}
              height="100%"
              eventClassNames={(arg) => {
                const type = arg.event.extendedProps.type;
                if (type === 'study') return 'study-block';
                if (type === 'review') return 'review-block';
                return `event-${type}`;
              }}
            />
          </div>
        </div>
      </main>

      {/* Render hover card */}
      {hoverCard && (
        <EventHoverCard
          event={hoverCard.event}
          position={hoverCard.position}
          onClose={clearHoverCard}
          onEdit={(event) => {
            clearHoverCard();
            const assignment = assignments.find(a => a.id === event.id);
            setEditingAssignment(assignment);
            setShowAssignmentModal(true);
          }}
          onDelete={(id) => {
            clearHoverCard();
            const assignment = assignments.find(a => a.id === id);
            setSelectedAssignment(assignment);
            handleAssignmentDelete();
          }}
        />
      )}

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

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onImport={handleDataImport}
        onClearData={handleClearData}
      />

      {/* Parser Modal */}
      <ParserModal
        isOpen={showParserModal}
        onClose={() => setShowParserModal(false)}
        onComplete={handleParserImport}
        courses={courses}
      />
    </div>
  )
}

export default App