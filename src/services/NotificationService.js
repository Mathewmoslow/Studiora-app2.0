class NotificationService {
  constructor() {
    this.scheduledNotifications = new Map();
    this.settings = this.loadSettings();
  }

  // Load saved notification settings
  loadSettings() {
    const saved = localStorage.getItem('notification_settings');
    return saved ? JSON.parse(saved) : {
      enabled: true,
      studyReminders: true,
      assignmentReminders: true,
      dailySummary: true,
      dailySummaryTime: '08:00',
      reminderMinutes: 15
    };
  }

  // Save notification settings
  saveSettings(settings) {
    this.settings = { ...this.settings, ...settings };
    localStorage.setItem('notification_settings', JSON.stringify(this.settings));
  }

  // Request browser permission
  async requestPermission() {
    if (!('Notification' in window)) {
      console.log('This browser does not support notifications');
      return false;
    }

    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }

  // Show immediate notification
  showNotification(title, options = {}) {
    if (Notification.permission === 'granted' && this.settings.enabled) {
      const notification = new Notification(title, {
        ...options
      });

      // Auto close after 10 seconds
      setTimeout(() => notification.close(), 10000);

      // Handle click
      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    }
  }

  // Schedule a future notification
  scheduleNotification(id, time, title, body) {
    // Cancel existing if any
    this.cancelNotification(id);

    const delay = time - Date.now();
    if (delay > 0) {
      const timeoutId = setTimeout(() => {
        this.showNotification(title, { body });
        this.scheduledNotifications.delete(id);
      }, delay);

      this.scheduledNotifications.set(id, timeoutId);
    }
  }

  // Cancel a scheduled notification
  cancelNotification(id) {
    if (this.scheduledNotifications.has(id)) {
      clearTimeout(this.scheduledNotifications.get(id));
      this.scheduledNotifications.delete(id);
    }
  }

  // Schedule study block reminders
  scheduleStudyReminders(studyBlocks) {
    if (!this.settings.studyReminders) return;

    studyBlocks.forEach(block => {
      const reminderTime = new Date(block.start);
      reminderTime.setMinutes(reminderTime.getMinutes() - this.settings.reminderMinutes);

      this.scheduleNotification(
        `study_${block.id}`,
        reminderTime,
        '📚 Study Session Starting Soon',
        `${block.title} in ${this.settings.reminderMinutes} minutes`
      );
    });
  }

  // Schedule assignment reminders
  scheduleAssignmentReminders(assignments) {
    if (!this.settings.assignmentReminders) return;

    assignments.forEach(assignment => {
      if (assignment.completed) return;

      const dueDate = new Date(`${assignment.date} ${assignment.time || '23:59'}`);
      
      // 24 hours before
      const dayBefore = new Date(dueDate);
      dayBefore.setHours(dayBefore.getHours() - 24);
      
      this.scheduleNotification(
        `assign_24h_${assignment.id}`,
        dayBefore,
        '📅 Assignment Due Tomorrow',
        `${assignment.title} is due in 24 hours`
      );

      // 3 hours before
      const threeHoursBefore = new Date(dueDate);
      threeHoursBefore.setHours(threeHoursBefore.getHours() - 3);
      
      this.scheduleNotification(
        `assign_3h_${assignment.id}`,
        threeHoursBefore,
        '⏰ Assignment Due Soon',
        `${assignment.title} is due in 3 hours`
      );

      // 1 hour before for high priority
      if (assignment.priority === 'high') {
        const oneHourBefore = new Date(dueDate);
        oneHourBefore.setHours(oneHourBefore.getHours() - 1);
        
        this.scheduleNotification(
          `assign_1h_${assignment.id}`,
          oneHourBefore,
          '🚨 High Priority Due Soon',
          `${assignment.title} is due in 1 hour!`
        );
      }
    });
  }

  // Schedule daily summary
  scheduleDailySummary(assignments, studyBlocks) {
    if (!this.settings.dailySummary) return;

    // Get today's date at summary time
    const today = new Date();
    const [hours, minutes] = this.settings.dailySummaryTime.split(':');
    today.setHours(parseInt(hours), parseInt(minutes), 0, 0);

    // If time has passed today, schedule for tomorrow
    if (today < new Date()) {
      today.setDate(today.getDate() + 1);
    }

    // Calculate summary data
    const todayStr = new Date().toISOString().split('T')[0];
    const todayAssignments = assignments.filter(a => 
      a.date === todayStr && !a.completed
    );
    const todayStudyBlocks = studyBlocks.filter(b => 
      b.date === todayStr
    );

    const totalStudyHours = todayStudyBlocks.reduce((sum, b) => 
      sum + b.extendedProps.hours, 0
    );

    // Create summary message
    let summary = `📊 Today's Overview:\n`;
    summary += `${todayAssignments.length} assignments due\n`;
    summary += `${todayStudyBlocks.length} study sessions (${totalStudyHours.toFixed(1)}h total)`;

    // Add priority items
    const highPriority = todayAssignments.filter(a => a.priority === 'high');
    if (highPriority.length > 0) {
      summary += `\n🚨 High Priority: ${highPriority.map(a => a.title).join(', ')}`;
    }

    this.scheduleNotification(
      'daily_summary',
      today,
      '☀️ Good Morning! Here\'s Your Day',
      summary
    );
  }

  // Update all notifications when data changes
  updateAllNotifications(assignments, studyBlocks) {
    // Clear all existing
    this.scheduledNotifications.forEach((timeoutId, id) => {
      clearTimeout(timeoutId);
    });
    this.scheduledNotifications.clear();

    // Reschedule all
    this.scheduleStudyReminders(studyBlocks);
    this.scheduleAssignmentReminders(assignments);
    this.scheduleDailySummary(assignments, studyBlocks);
  }

  // Get notification status
  getStatus() {
    return {
      permission: Notification.permission,
      enabled: this.settings.enabled,
      scheduled: this.scheduledNotifications.size,
      settings: this.settings
    };
  }
}

export default NotificationService;