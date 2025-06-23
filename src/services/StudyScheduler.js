import { addDays, startOfDay, endOfDay, isWeekend, differenceInDays, isBefore, isAfter } from 'date-fns';

class StudyScheduler {
  constructor() {
    this.studyBlocks = [];
    this.preferences = {
      dailyMaxHours: 6,
      weekendMaxHours: 4,
      blockDuration: 1.5,
      preferredTimes: {
        morning: { start: 8, end: 12, weight: 1 },
        afternoon: { start: 13, end: 17, weight: 1 },
        evening: { start: 18, end: 22, weight: 1 }
      },
      energyLevels: {
        monday: 0.9,
        tuesday: 1.0,
        wednesday: 0.95,
        thursday: 0.85,
        friday: 0.7,
        saturday: 0.8,
        sunday: 0.9
      },
      bufferBeforeExam: 2, // days
      reviewPercentage: 0.2, // 20% time for review
      breakBetweenBlocks: 0.25 // 15 min breaks
    };
  }

  /**
   * Generate study schedule for all assignments
   */
  generateSchedule(assignments, courses, existingEvents, startDate, endDate) {
    this.studyBlocks = [];
    
    // Sort assignments by priority and due date
    const prioritizedAssignments = this.prioritizeAssignments(assignments, courses);
    
    // Calculate time needed for each assignment
    const assignmentsWithTime = prioritizedAssignments.map(assignment => ({
      ...assignment,
      totalHours: this.calculateStudyTime(assignment),
      hoursScheduled: 0,
      completed: false
    }));

    // Schedule each assignment
    assignmentsWithTime.forEach(assignment => {
      this.scheduleAssignment(assignment, existingEvents, startDate, endDate);
    });

    // Add review sessions
    this.addReviewSessions(assignmentsWithTime, existingEvents, startDate, endDate);

    // Optimize schedule for energy levels
    this.optimizeForEnergyLevels();

    return this.studyBlocks;
  }

  /**
   * Calculate study time based on assignment type and complexity
   */
  calculateStudyTime(assignment) {
    const baseHours = assignment.hours || this.estimateHours(assignment.type);
    const priorityMultiplier = this.getPriorityMultiplier(assignment.priority);
    const typeMultiplier = this.getTypeMultiplier(assignment.type);
    
    let totalHours = baseHours * priorityMultiplier * typeMultiplier;
    
    // Add review time for exams
    if (assignment.type === 'exam') {
      totalHours += totalHours * this.preferences.reviewPercentage;
    }
    
    return Math.round(totalHours * 2) / 2; // Round to nearest 0.5
  }

  /**
   * Estimate hours based on assignment type
   */
  estimateHours(type) {
    const estimates = {
      'reading': 2.5,
      'video': 0.5,
      'quiz': 1.5,
      'exam': 8,
      'assignment': 3,
      'project': 6,
      'paper': 8,
      'presentation': 4,
      'discussion': 1,
      'lab': 2,
      'clinical': 0, // No prep needed
      'vsim': 2,
      'activity': 1,
      'prep': 2,
      'remediation': 2.5,
      'simulation': 1
    };
    return estimates[type] || 2;
  }

  /**
   * Get priority multiplier
   */
  getPriorityMultiplier(priority) {
    const multipliers = {
      'low': 0.8,
      'medium': 1.0,
      'high': 1.3,
      'urgent': 1.5
    };
    return multipliers[priority] || 1.0;
  }

  /**
   * Get type multiplier for different assignment types
   */
  getTypeMultiplier(type) {
    const multipliers = {
      'exam': 1.5,
      'project': 1.3,
      'paper': 1.3,
      'quiz': 1.1,
      'assignment': 1.0,
      'reading': 0.9,
      'video': 0.7
    };
    return multipliers[type] || 1.0;
  }

  /**
   * Prioritize assignments based on multiple factors
   */
  prioritizeAssignments(assignments, courses) {
    return assignments.sort((a, b) => {
      // First by priority
      const priorityOrder = { 'urgent': 0, 'high': 1, 'medium': 2, 'low': 3 };
      const priorityDiff = (priorityOrder[a.priority] || 2) - (priorityOrder[b.priority] || 2);
      if (priorityDiff !== 0) return priorityDiff;
      
      // Then by due date
      const dateDiff = new Date(a.date) - new Date(b.date);
      if (dateDiff !== 0) return dateDiff;
      
      // Then by course priority (if courses have priority)
      const courseA = courses.find(c => c.id === a.courseId);
      const courseB = courses.find(c => c.id === b.courseId);
      const coursePriorityDiff = (courseB?.priority || 0) - (courseA?.priority || 0);
      if (coursePriorityDiff !== 0) return coursePriorityDiff;
      
      // Finally by estimated time (longer tasks first)
      return b.hours - a.hours;
    });
  }

  /**
   * Schedule a single assignment
   */
  scheduleAssignment(assignment, existingEvents, startDate, endDate) {
    const dueDate = new Date(assignment.date);
    const daysBeforeDue = assignment.type === 'exam' ? 
      this.preferences.bufferBeforeExam + 3 : 3;
    
    let scheduleStart = new Date(Math.max(
      startDate,
      addDays(dueDate, -daysBeforeDue)
    ));

    let currentDate = new Date(scheduleStart);
    
    while (assignment.hoursScheduled < assignment.totalHours && 
           isBefore(currentDate, dueDate) && 
           isBefore(currentDate, endDate)) {
      
      const dayName = currentDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const energyLevel = this.preferences.energyLevels[dayName] || 1;
      const isWeekendDay = isWeekend(currentDate);
      const maxHours = isWeekendDay ? 
        this.preferences.weekendMaxHours : 
        this.preferences.dailyMaxHours;
      
      // Adjust max hours based on energy level
      const adjustedMaxHours = maxHours * energyLevel;
      
      // Check existing hours scheduled for this day
      const existingHours = this.getScheduledHours(currentDate);
      
      if (existingHours < adjustedMaxHours) {
        const availableHours = adjustedMaxHours - existingHours;
        const hoursToSchedule = Math.min(
          this.preferences.blockDuration,
          assignment.totalHours - assignment.hoursScheduled,
          availableHours
        );
        
        if (hoursToSchedule >= 0.5) { // Minimum 30 min blocks
          const timeSlot = this.findBestTimeSlot(
            currentDate, 
            hoursToSchedule, 
            existingEvents,
            assignment.type
          );
          
          if (timeSlot) {
            this.studyBlocks.push({
              id: `study_${assignment.id}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              assignmentId: assignment.id,
              courseId: assignment.courseId,
              title: `Study: ${assignment.title}`,
              type: 'study',
              date: timeSlot.date,
              start: timeSlot.start,
              end: timeSlot.end,
              hours: hoursToSchedule,
              priority: assignment.priority,
              energyRequired: this.getEnergyRequired(assignment.type),
              assignmentTitle: assignment.title, // Added for hover card
              assignmentType: assignment.type
            });
            
            assignment.hoursScheduled += hoursToSchedule;
          }
        }
      }
      
      currentDate = addDays(currentDate, 1);
    }
  }

  /**
   * Find the best time slot for studying
   */
  findBestTimeSlot(date, hours, existingEvents, assignmentType) {
    const dayEvents = existingEvents.filter(event => {
      if (!event.start) return false;
      const eventDate = typeof event.start === 'string' ? new Date(event.start) : event.start;
      return startOfDay(eventDate).getTime() === startOfDay(date).getTime();
    });
    
    // Get preferred times based on assignment type
    const preferredPeriods = this.getPreferredPeriods(assignmentType);
    
    for (const period of preferredPeriods) {
      const slots = this.findAvailableSlots(
        date, 
        period.start, 
        period.end, 
        dayEvents, 
        hours
      );
      
      if (slots.length > 0) {
        // Return the best slot (could be optimized further)
        return slots[0];
      }
    }
    
    // If no preferred time available, find any available slot
    return this.findAnyAvailableSlot(date, dayEvents, hours);
  }

  /**
   * Get preferred study periods based on assignment type
   */
  getPreferredPeriods(assignmentType) {
    const preferences = {
      'exam': ['morning', 'afternoon'],
      'quiz': ['morning', 'evening'],
      'reading': ['evening', 'afternoon'],
      'video': ['evening', 'afternoon'],
      'assignment': ['afternoon', 'evening'],
      'project': ['afternoon', 'morning']
    };
    
    const preferred = preferences[assignmentType] || ['morning', 'afternoon', 'evening'];
    return preferred.map(period => this.preferences.preferredTimes[period]);
  }

  /**
   * Find available time slots in a period
   */
  findAvailableSlots(date, periodStart, periodEnd, dayEvents, hoursNeeded) {
    const slots = [];
    let currentTime = new Date(date);
    currentTime.setHours(periodStart, 0, 0, 0);
    
    const endTime = new Date(date);
    endTime.setHours(periodEnd, 0, 0, 0);
    
    while (currentTime < endTime) {
      const slotEnd = new Date(currentTime);
      slotEnd.setHours(currentTime.getHours() + hoursNeeded);
      
      // Check if slot conflicts with existing events
      const hasConflict = dayEvents.some(event => {
        const eventStart = new Date(event.start);
        const eventEnd = event.end ? new Date(event.end) : new Date(eventStart.getTime() + 60 * 60 * 1000); // Default 1 hour
        return (currentTime < eventEnd && slotEnd > eventStart);
      });
      
      if (!hasConflict && slotEnd <= endTime) {
        slots.push({
          date: date.toISOString().split('T')[0],
          start: new Date(currentTime).toISOString(),
          end: new Date(slotEnd).toISOString()
        });
      }
      
      // Move to next potential slot
      currentTime.setMinutes(currentTime.getMinutes() + 30);
    }
    
    return slots;
  }

  /**
   * Find any available slot in the day
   */
  findAnyAvailableSlot(date, dayEvents, hours) {
    // Try all periods in order of preference weight
    const periods = Object.entries(this.preferences.preferredTimes)
      .sort((a, b) => b[1].weight - a[1].weight);
    
    for (const [periodName, period] of periods) {
      const slots = this.findAvailableSlots(date, period.start, period.end, dayEvents, hours);
      if (slots.length > 0) return slots[0];
    }
    
    // Default slot if nothing else available
    const defaultStart = new Date(date);
    defaultStart.setHours(19, 0, 0, 0); // 7 PM
    const defaultEnd = new Date(defaultStart);
    defaultEnd.setHours(defaultStart.getHours() + hours);
    
    return {
      date: date.toISOString().split('T')[0],
      start: defaultStart.toISOString(),
      end: defaultEnd.toISOString()
    };
  }

  /**
   * Get total hours scheduled for a specific day
   */
  getScheduledHours(date) {
    const dayStart = startOfDay(date);
    const dayEnd = endOfDay(date);
    
    return this.studyBlocks
      .filter(block => {
        const blockDate = new Date(block.start);
        return blockDate >= dayStart && blockDate <= dayEnd;
      })
      .reduce((total, block) => total + block.hours, 0);
  }

  /**
   * Add review sessions before exams
   */
  addReviewSessions(assignments, existingEvents, startDate, endDate) {
    const exams = assignments.filter(a => a.type === 'exam');
    
    exams.forEach(exam => {
      const examDate = new Date(exam.date);
      const reviewDays = this.preferences.bufferBeforeExam;
      
      for (let i = 1; i <= reviewDays; i++) {
        const reviewDate = addDays(examDate, -i);
        if (isAfter(reviewDate, startDate) && isBefore(reviewDate, endDate)) {
          const reviewHours = 2; // 2 hours of review per day
          
          const timeSlot = this.findBestTimeSlot(
            reviewDate,
            reviewHours,
            existingEvents,
            'review'
          );
          
          if (timeSlot) {
            this.studyBlocks.push({
              id: `review_${exam.id}_${i}_${Date.now()}`,
              assignmentId: exam.id,
              courseId: exam.courseId,
              title: `Review: ${exam.title}`,
              type: 'review',
              date: timeSlot.date,
              start: timeSlot.start,
              end: timeSlot.end,
              hours: reviewHours,
              priority: 'high',
              energyRequired: 'high',
              assignmentTitle: exam.title // Added for hover card
            });
          }
        }
      }
    });
  }

  /**
   * Optimize schedule based on energy levels
   */
  optimizeForEnergyLevels() {
    // Sort study blocks by energy required
    const highEnergyBlocks = this.studyBlocks.filter(b => 
      this.getEnergyRequired(b.assignmentType || b.type) === 'high'
    );
    
    // Reschedule high-energy tasks to high-energy times
    // This is a simplified version - could be made more sophisticated
    highEnergyBlocks.forEach(block => {
      const blockDate = new Date(block.start);
      const dayName = blockDate.toLocaleDateString('en-US', { weekday: 'long' }).toLowerCase();
      const energyLevel = this.preferences.energyLevels[dayName];
      
      // If scheduled on a low-energy day, try to move it
      if (energyLevel < 0.8) {
        // Logic to reschedule to a better day would go here
        // For now, we'll just flag it
        block.suboptimal = true;
      }
    });
  }

  /**
   * Get energy required for different task types
   */
  getEnergyRequired(type) {
    const energyLevels = {
      'exam': 'high',
      'quiz': 'high',
      'project': 'high',
      'paper': 'high',
      'assignment': 'medium',
      'reading': 'medium',
      'video': 'low',
      'review': 'high',
      'discussion': 'low'
    };
    return energyLevels[type] || 'medium';
  }

  /**
   * Update preferences
   */
  updatePreferences(newPreferences) {
    this.preferences = { ...this.preferences, ...newPreferences };
  }

  /**
   * Get study statistics
   */
  getStatistics() {
    const totalHours = this.studyBlocks.reduce((sum, block) => sum + block.hours, 0);
    const byType = {};
    const byCourse = {};
    const byDay = {};
    
    this.studyBlocks.forEach(block => {
      // By type
      byType[block.type] = (byType[block.type] || 0) + block.hours;
      
      // By course
      byCourse[block.courseId] = (byCourse[block.courseId] || 0) + block.hours;
      
      // By day
      const day = new Date(block.start).toLocaleDateString('en-US', { weekday: 'long' });
      byDay[day] = (byDay[day] || 0) + block.hours;
    });
    
    return {
      totalHours,
      averagePerDay: totalHours / 7,
      byType,
      byCourse,
      byDay,
      blockCount: this.studyBlocks.length
    };
  }

  /**
   * Export study blocks for calendar integration
   */
  exportForCalendar() {
    return this.studyBlocks.map(block => ({
      id: block.id,
      title: block.title,
      start: block.start,
      end: block.end,
      backgroundColor: block.type === 'review' ? '#7c3aed' : '#000000',
      textColor: '#ffffff',
      extendedProps: {
        type: block.type,
        assignmentId: block.assignmentId,
        courseId: block.courseId,
        hours: block.hours,
        priority: block.priority,
        energyRequired: block.energyRequired,
        assignmentTitle: block.assignmentTitle // Ensure this is passed
      }
    }));
  }
}

export default StudyScheduler;