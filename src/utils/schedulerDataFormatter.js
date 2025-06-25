export default function formatForScheduler(assignments = [], courseId = '') {
  return assignments.map(assignment => ({
    id: assignment.id || `assign_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: assignment.title || 'Untitled Assignment',
    description: assignment.description || '',
    courseId: assignment.courseId || courseId,
    type: assignment.type || 'assignment',
    date: assignment.date || new Date().toISOString().split('T')[0],
    time: assignment.time || '23:59',
    hours: typeof assignment.hours === 'number' ? assignment.hours : parseFloat(assignment.hours) || 2,
    priority: assignment.priority || 'medium',
    completed: assignment.completed || false,
    createdAt: assignment.createdAt || new Date().toISOString()
  }));
}
