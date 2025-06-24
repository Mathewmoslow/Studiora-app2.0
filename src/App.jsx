import React, { useState, useEffect } from 'react'
import FullCalendar from '@fullcalendar/react'
import dayGridPlugin from '@fullcalendar/daygrid'
import timeGridPlugin from '@fullcalendar/timegrid'
import interactionPlugin from '@fullcalendar/interaction'
import { Calendar, Plus, Settings, BookOpen, Edit2, Trash2, Brain, FileText } from 'lucide-react'
import { format } from 'date-fns'
import CourseModal from './components/CourseModal'
import AssignmentModal from './components/AssignmentModal'
import AssignmentDetails from './components/AssignmentDetails'
import DataManager from './utils/DataManager'
import SettingsModal from './components/SettingsModal'
import StudySchedulerModal from './components/StudySchedulerModal'
import ParserModal from './components/ParserModal'
import { EventHoverCard, useEventHover, HoverCardStyles } from './components/EventHoverCard'
import NotificationService from './services/NotificationService'

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
  const [showSchedulerModal, setShowSchedulerModal] = useState(false)
  const [showParserModal, setShowParserModal] = useState(false)
  const [notificationService] = useState(() => new NotificationService())
  
  // Dark mode state
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? saved === 'true' : true; // Default to dark
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Toggle dark mode
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', darkMode ? 'dark' : 'light');
    localStorage.setItem('darkMode', darkMode.toString());
  }, [darkMode]);

  // Initialize notifications
  useEffect(() => {
    notificationService.requestPermission();
  }, []);

  // Update notifications when data changes
  useEffect(() => {
    notificationService.updateAllNotifications(assignments, studyBlocks);
  }, [assignments, studyBlocks]);
  
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
        className: assignment.completed ? 'completed' : '',
        extendedProps: {
          type: assignment.type,
          hours: assignment.hours,
          courseCode: course?.code || 'Unknown',
          courseId: assignment.courseId,
          priority: assignment.priority || 'medium',
          isAssignment: true,
          description: assignment.description,
          assignmentTitle: assignment.title,
          completed: assignment.completed
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

  // Handle assignment completion toggle
  const handleAssignmentComplete = (assignmentId) => {
    setAssignments(assignments.map(a => 
      a.id === assignmentId 
        ? { ...a, completed: !a.completed, completedAt: !a.completed ? new Date().toISOString() : null }
        : a
    ));
    setCalendarKey(prev => prev + 1);
  };

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
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    const cardWidth = 320;
    const cardHeight = 400; // Approximate max height
    
    // Determine best position
    let x, y;
    const isRightHalf = rect.left > viewportWidth * 0.4; // Trigger earlier for more space
    
    if (isRightHalf) {
      // Far left of the event
      x = Math.max(10, rect.left - cardWidth - 150);
    } else {
      // Right of the event
      x = rect.right + 30;
    }
    
    // Vertical positioning - prefer above/below if horizontal space is tight
    y = rect.top;
    
    // If card would go off bottom, position above
    if (y + cardHeight > viewportHeight - 20) {
      y = Math.max(20, rect.bottom - cardHeight);
    }
    
    // If still issues, position below the event
    if (isRightHalf && x < 10) {
      x = Math.max(10, rect.left - 50);
      y = rect.bottom + 20;
    }
    
    info.el.setAttribute('data-event-id', info.event.id);
    
    showHoverCard(info.event, {
      x: x,
      y: y
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
          <button className="menu-toggle" onClick={() => setSidebarOpen(!sidebarOpen)}>
            ☰
          </button>
          <div className="app-title">
            <BookOpen size={20} />
            <span>Studiora</span>
          </div>
          <div className="header-actions">
            <button
              className="btn"
              onClick={() => setShowSchedulerModal(true)}
              disabled={assignments.length === 0}
              title={assignments.length === 0 ? 'Add assignments first' : 'Generate study schedule'}
            >
              <Brain size={16} />
              <span>Study Plan</span>
            </button>
            <button
              className="btn"
              onClick={() => setShowParserModal(true)}
              disabled={courses.length === 0}
              title={courses.length === 0 ? 'Create a course first' : 'Import syllabus'}
            >
              <FileText size={16} />
              <span>Import</span>
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
              <span>Assignment</span>
            </button>
            <button
              className="theme-toggle"
              onClick={() => setDarkMode(!darkMode)}
              title={darkMode ? 'Light mode' : 'Dark mode'}
            >
              {darkMode ? '☀️' : '🌙'}
            </button>
            <button
              className="btn-icon"
              onClick={() => setShowSettingsModal(true)}
            >
              <Settings size={16} />
            </button>
          </div>
        </div>
      </header>

      <div className="main-layout">
        {/* Sidebar */}
        <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
          <div className="sidebar-content">
            <div className="sidebar-section">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3>My Courses</h3>
                <button
                  className="btn-icon"
                  onClick={() => {
                    setEditingCourse(null)
                    setShowCourseModal(true)
                  }}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="course-list-sidebar">
                <div 
                  className={`course-item ${selectedCourse === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedCourse('all')}
                >
                  <div className="course-item-header">
                    <div className="course-color-dot" style={{ backgroundColor: '#6b7280' }} />
                    <div>
                      <div className="course-item-title">All Courses</div>
                      <div className="course-item-subtitle">View everything</div>
                    </div>
                  </div>
                  <div className="course-item-stats">
                    <span>{assignments.length} tasks</span>
                  </div>
                </div>
                {courses.map(course => {
                  const courseAssignments = assignments.filter(a => a.courseId === course.id);
                  return (
                    <div 
                      key={course.id} 
                      className={`course-item ${selectedCourse === course.id ? 'active' : ''}`}
                      onClick={() => setSelectedCourse(course.id)}
                    >
                      <div className="course-item-header">
                        <div className="course-color-dot" style={{ backgroundColor: course.color }} />
                        <div>
                          <div className="course-item-title">{course.code}</div>
                          <div className="course-item-subtitle">{course.name}</div>
                        </div>
                      </div>
                      <div className="course-item-stats">
                        <span>{courseAssignments.length} tasks</span>
                        <span>{course.credits} credits</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Sidebar overlay for mobile */}
        <div 
          className={`sidebar-overlay ${sidebarOpen ? 'active' : ''}`}
          onClick={() => setSidebarOpen(false)}
        />

        {/* Main Content */}
        <main className="main-content">
          {/* Stats Bar */}
          <div className="stats-bar">
            <div className="stat-chip">
              <span className="stat-chip-value">{stats.totalAssignments}</span>
              <span className="stat-chip-label">Total</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">{stats.completedAssignments}</span>
              <span className="stat-chip-label">Completed</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">{stats.upcomingWeek}</span>
              <span className="stat-chip-label">This Week</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">{stats.totalHours}h</span>
              <span className="stat-chip-label">Est. Hours</span>
            </div>
            <div className="stat-chip">
              <span className="stat-chip-value">{stats.studyHours.toFixed(1)}h</span>
              <span className="stat-chip-label">Scheduled</span>
            </div>
          </div>

          {/* Calendar */}
          <div className="calendar-wrapper">
            <div className="calendar-header">
              <h2>{selectedCourse === 'all' ? 'All Courses' : courses.find(c => c.id === selectedCourse)?.name || 'Course'} Calendar</h2>
              <p>Hover over events for details • Click to view/edit • Black blocks are study time</p>
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
      </div>

      {/* Render hover card */}
      {hoverCard && (
        <EventHoverCard
          event={hoverCard.event}
          position={hoverCard.position}
          onClose={clearHoverCard}
          onEdit={(event) => {
            clearHoverCard();
            if (event.extendedProps.isAssignment) {
              const assignment = assignments.find(a => a.id === event.id);
              setEditingAssignment(assignment);
              setShowAssignmentModal(true);
            } else if (event.extendedProps.type === 'study' || event.extendedProps.type === 'review') {
              // For study blocks, we need to regenerate the schedule
              if (confirm('Editing study blocks requires regenerating the schedule. Continue?')) {
                setStudyBlocks([]);
              }
            }
          }}
          onDelete={(id) => {
            clearHoverCard();
            if (assignments.find(a => a.id === id)) {
              const assignment = assignments.find(a => a.id === id);
              setSelectedAssignment(assignment);
              handleAssignmentDelete();
            } else {
              // Delete study block
              setStudyBlocks(studyBlocks.filter(block => block.id !== id));
              setCalendarKey(prev => prev + 1);
            }
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
        onComplete={handleAssignmentComplete}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onImport={handleDataImport}
        onClearData={handleClearData}
      />

      {/* Study Scheduler Modal */}
      <StudySchedulerModal
        isOpen={showSchedulerModal}
        onClose={() => setShowSchedulerModal(false)}
        assignments={filteredAssignments}
        courses={courses}
        calendarEvents={calendarEvents.filter(e => e.extendedProps?.type !== 'study' && e.extendedProps?.type !== 'review')}
        onScheduleGenerated={handleScheduleGenerated}
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