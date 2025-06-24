import React, { useState, useEffect } from 'react';
import { Bell, Clock, Calendar, Sun } from 'lucide-react';

function NotificationSettings({ notificationService, onClose }) {
  const [settings, setSettings] = useState(notificationService.settings);
  const [permission, setPermission] = useState(Notification.permission);

  const handleToggle = (key) => {
    const newSettings = { ...settings, [key]: !settings[key] };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const handleTimeChange = (key, value) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    notificationService.saveSettings(newSettings);
  };

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(granted ? 'granted' : 'denied');
  };

  return (
    <div className="notification-settings">
      <h3>
        <Bell size={20} />
        Notification Settings
      </h3>

      {permission !== 'granted' && (
        <div className="permission-banner">
          <p>Enable browser notifications to get reminders</p>
          <button className="btn btn-primary" onClick={requestPermission}>
            Enable Notifications
          </button>
        </div>
      )}

      <div className="settings-group">
        <label className="toggle-setting">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={() => handleToggle('enabled')}
          />
          <span>Enable All Notifications</span>
        </label>

        <div className={`sub-settings ${!settings.enabled ? 'disabled' : ''}`}>
          <label className="toggle-setting">
            <input
              type="checkbox"
              checked={settings.studyReminders}
              onChange={() => handleToggle('studyReminders')}
              disabled={!settings.enabled}
            />
            <span>
              <Clock size={16} />
              Study Session Reminders
            </span>
          </label>

          <label className="toggle-setting">
            <input
              type="checkbox"
              checked={settings.assignmentReminders}
              onChange={() => handleToggle('assignmentReminders')}
              disabled={!settings.enabled}
            />
            <span>
              <Calendar size={16} />
              Assignment Due Reminders
            </span>
          </label>

          <label className="toggle-setting">
            <input
              type="checkbox"
              checked={settings.dailySummary}
              onChange={() => handleToggle('dailySummary')}
              disabled={!settings.enabled}
            />
            <span>
              <Sun size={16} />
              Daily Summary
            </span>
          </label>
        </div>
      </div>

      <div className="settings-group">
        <h4>Timing Preferences</h4>
        
        <div className="setting-row">
          <label>Reminder Time Before Events</label>
          <select
            value={settings.reminderMinutes}
            onChange={(e) => handleTimeChange('reminderMinutes', parseInt(e.target.value))}
            disabled={!settings.enabled}
          >
            <option value={5}>5 minutes</option>
            <option value={10}>10 minutes</option>
            <option value={15}>15 minutes</option>
            <option value={30}>30 minutes</option>
            <option value={60}>1 hour</option>
          </select>
        </div>

        <div className="setting-row">
          <label>Daily Summary Time</label>
          <input
            type="time"
            value={settings.dailySummaryTime}
            onChange={(e) => handleTimeChange('dailySummaryTime', e.target.value)}
            disabled={!settings.enabled || !settings.dailySummary}
          />
        </div>
      </div>

      <div className="notification-preview">
        <h4>Preview</h4>
        <button 
          className="btn btn-secondary"
          onClick={() => {
            notificationService.showNotification(
              '🔔 Test Notification',
              { body: 'Your notifications are working!' }
            );
          }}
          disabled={permission !== 'granted' || !settings.enabled}
        >
          Send Test Notification
        </button>
      </div>
    </div>
  );
}

export default NotificationSettings;