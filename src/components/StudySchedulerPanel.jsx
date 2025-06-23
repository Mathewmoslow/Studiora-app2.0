import React, { useState, useEffect } from 'react';
import { Calendar, Brain, Clock, Zap, BarChart, RefreshCw } from 'lucide-react';
import StudyScheduler from '../services/StudyScheduler';

function StudySchedulerPanel({ assignments, courses, calendarEvents, onScheduleGenerated }) {
  const [scheduler] = useState(() => new StudyScheduler());
  const [preferences, setPreferences] = useState({
    dailyMaxHours: 6,
    weekendMaxHours: 4,
    blockDuration: 1.5,
    morningWeight: 1,
    afternoonWeight: 1,
    eveningWeight: 1,
    energyMonday: 90,
    energyTuesday: 100,
    energyWednesday: 95,
    energyThursday: 85,
    energyFriday: 70,
    energySaturday: 80,
    energySunday: 90
  });
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [statistics, setStatistics] = useState(null);
  const [lastGenerated, setLastGenerated] = useState(null);

  // Update scheduler preferences when UI preferences change
  useEffect(() => {
    scheduler.updatePreferences({
      dailyMaxHours: preferences.dailyMaxHours,
      weekendMaxHours: preferences.weekendMaxHours,
      blockDuration: preferences.blockDuration,
      preferredTimes: {
        morning: { start: 8, end: 12, weight: preferences.morningWeight },
        afternoon: { start: 13, end: 17, weight: preferences.afternoonWeight },
        evening: { start: 18, end: 22, weight: preferences.eveningWeight }
      },
      energyLevels: {
        monday: preferences.energyMonday / 100,
        tuesday: preferences.energyTuesday / 100,
        wednesday: preferences.energyWednesday / 100,
        thursday: preferences.energyThursday / 100,
        friday: preferences.energyFriday / 100,
        saturday: preferences.energySaturday / 100,
        sunday: preferences.energySunday / 100
      }
    });
  }, [preferences, scheduler]);

  const generateSchedule = () => {
    setIsGenerating(true);
    
    // Get incomplete assignments
    const incompleteAssignments = assignments.filter(a => !a.completed);
    
    // Set date range (current date to end of semester)
    const startDate = new Date();
    const endDate = new Date('2025-08-10'); // End of semester
    
    // Generate schedule
    const studyBlocks = scheduler.generateSchedule(
      incompleteAssignments,
      courses,
      calendarEvents,
      startDate,
      endDate
    );
    
    // Get statistics
    const stats = scheduler.getStatistics();
    setStatistics(stats);
    
    // Export for calendar
    const calendarBlocks = scheduler.exportForCalendar();
    onScheduleGenerated(calendarBlocks);
    
    setLastGenerated(new Date());
    setIsGenerating(false);
  };

  const handlePreferenceChange = (key, value) => {
    setPreferences(prev => ({
      ...prev,
      [key]: parseFloat(value) || 0
    }));
  };

  return (
    <div className="scheduler-panel">
      <div className="scheduler-header">
        <h3>
          <Brain size={20} />
          Adaptive Study Scheduler
        </h3>
        {lastGenerated && (
          <span className="last-generated">
            Last generated: {lastGenerated.toLocaleTimeString()}
          </span>
        )}
      </div>

      <div className="scheduler-content">
        {/* Time Preferences */}
        <div className="preference-section">
          <h4>
            <Clock size={16} />
            Time Limits
          </h4>
          <div className="preference-grid">
            <div className="preference-item">
              <label>Daily Max Hours</label>
              <input
                type="number"
                value={preferences.dailyMaxHours}
                onChange={(e) => handlePreferenceChange('dailyMaxHours', e.target.value)}
                min="1"
                max="12"
                step="0.5"
              />
            </div>
            <div className="preference-item">
              <label>Weekend Max Hours</label>
              <input
                type="number"
                value={preferences.weekendMaxHours}
                onChange={(e) => handlePreferenceChange('weekendMaxHours', e.target.value)}
                min="1"
                max="8"
                step="0.5"
              />
            </div>
            <div className="preference-item">
              <label>Block Duration</label>
              <input
                type="number"
                value={preferences.blockDuration}
                onChange={(e) => handlePreferenceChange('blockDuration', e.target.value)}
                min="0.5"
                max="3"
                step="0.5"
              />
            </div>
          </div>
        </div>

        {/* Time of Day Preferences */}
        <div className="preference-section">
          <h4>Preferred Study Times</h4>
          <div className="time-preference-grid">
            <div className="time-preference">
              <label>Morning (8AM-12PM)</label>
              <input
                type="range"
                value={preferences.morningWeight}
                onChange={(e) => handlePreferenceChange('morningWeight', e.target.value)}
                min="0"
                max="2"
                step="0.1"
              />
              <span>{(preferences.morningWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="time-preference">
              <label>Afternoon (1PM-5PM)</label>
              <input
                type="range"
                value={preferences.afternoonWeight}
                onChange={(e) => handlePreferenceChange('afternoonWeight', e.target.value)}
                min="0"
                max="2"
                step="0.1"
              />
              <span>{(preferences.afternoonWeight * 100).toFixed(0)}%</span>
            </div>
            <div className="time-preference">
              <label>Evening (6PM-10PM)</label>
              <input
                type="range"
                value={preferences.eveningWeight}
                onChange={(e) => handlePreferenceChange('eveningWeight', e.target.value)}
                min="0"
                max="2"
                step="0.1"
              />
              <span>{(preferences.eveningWeight * 100).toFixed(0)}%</span>
            </div>
          </div>
        </div>

        {/* Energy Levels */}
        <div className="preference-section">
          <h4>
            <Zap size={16} />
            Daily Energy Levels
          </h4>
          <div className="energy-grid">
            {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map(day => (
              <div key={day} className="energy-day">
                <label>{day.slice(0, 3)}</label>
                <input
                  type="range"
                  value={preferences[`energy${day}`]}
                  onChange={(e) => handlePreferenceChange(`energy${day}`, e.target.value)}
                  min="0"
                  max="100"
                  step="5"
                />
                <span>{preferences[`energy${day}`]}%</span>
              </div>
            ))}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="scheduler-actions">
          <button 
            className="btn btn-primary btn-large"
            onClick={generateSchedule}
            disabled={isGenerating || assignments.length === 0}
          >
            {isGenerating ? (
              <>
                <RefreshCw size={16} className="spin" />
                Generating...
              </>
            ) : (
              <>
                <Calendar size={16} />
                Generate Study Schedule
              </>
            )}
          </button>
          
          <button 
            className="btn btn-secondary"
            onClick={() => onScheduleGenerated([])}
          >
            Clear Schedule
          </button>
        </div>

        {/* Statistics */}
        {statistics && (
          <div className="scheduler-stats">
            <h4>
              <BarChart size={16} />
              Schedule Statistics
            </h4>
            <div className="stats-grid">
              <div className="stat-item">
                <span className="stat-value">{statistics.totalHours.toFixed(1)}</span>
                <span className="stat-label">Total Study Hours</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{statistics.blockCount}</span>
                <span className="stat-label">Study Blocks</span>
              </div>
              <div className="stat-item">
                <span className="stat-value">{statistics.averagePerDay.toFixed(1)}</span>
                <span className="stat-label">Avg Hours/Day</span>
              </div>
            </div>
            
            {/* Hours by Type */}
            <div className="stat-breakdown">
              <h5>Hours by Type</h5>
              {Object.entries(statistics.byType).map(([type, hours]) => (
                <div key={type} className="breakdown-item">
                  <span>{type}</span>
                  <span>{hours.toFixed(1)}h</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default StudySchedulerPanel;