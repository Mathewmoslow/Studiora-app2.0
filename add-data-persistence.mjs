#!/usr/bin/env node
import fs from 'fs';
import path from 'path';

console.log('🚀 Adding Data Persistence & Export/Import...\n');

// 1. Create DataManager utility
const dataManagerCode = `// Data persistence manager for Studiora
const STORAGE_KEYS = {
  COURSES: 'studiora_courses',
  ASSIGNMENTS: 'studiora_assignments',
  SETTINGS: 'studiora_settings',
  VERSION: 'studiora_version'
};

const CURRENT_VERSION = '1.0.0';

class DataManager {
  // Save data to localStorage
  static save(key, data) {
    try {
      localStorage.setItem(key, JSON.stringify(data));
      return true;
    } catch (error) {
      console.error('Failed to save data:', error);
      return false;
    }
  }

  // Load data from localStorage
  static load(key, defaultValue = null) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : defaultValue;
    } catch (error) {
      console.error('Failed to load data:', error);
      return defaultValue;
    }
  }

  // Save all app data
  static saveAllData(courses, assignments, settings = {}) {
    this.save(STORAGE_KEYS.COURSES, courses);
    this.save(STORAGE_KEYS.ASSIGNMENTS, assignments);
    this.save(STORAGE_KEYS.SETTINGS, settings);
    this.save(STORAGE_KEYS.VERSION, CURRENT_VERSION);
    console.log('💾 Data saved to localStorage');
  }

  // Load all app data
  static loadAllData() {
    const data = {
      courses: this.load(STORAGE_KEYS.COURSES, []),
      assignments: this.load(STORAGE_KEYS.ASSIGNMENTS, []),
      settings: this.load(STORAGE_KEYS.SETTINGS, {}),
      version: this.load(STORAGE_KEYS.VERSION, CURRENT_VERSION)
    };
    console.log('📂 Data loaded from localStorage');
    return data;
  }

  // Export all data as JSON
  static exportData(courses, assignments, settings = {}) {
    const exportData = {
      version: CURRENT_VERSION,
      exportDate: new Date().toISOString(),
      courses,
      assignments,
      settings,
      metadata: {
        totalCourses: courses.length,
        totalAssignments: assignments.length,
        appName: 'Studiora Nursing Planner'
      }
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = \`studiora-backup-\${new Date().toISOString().split('T')[0]}.json\`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('📤 Data exported successfully');
    return true;
  }

  // Import data from JSON file
  static async importData(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const importedData = JSON.parse(e.target.result);
          
          // Validate the imported data
          if (!importedData.version || !importedData.courses || !importedData.assignments) {
            throw new Error('Invalid backup file format');
          }
          
          // Check version compatibility (for future use)
          if (importedData.version !== CURRENT_VERSION) {
            console.warn('Importing from different version:', importedData.version);
          }
          
          resolve({
            courses: importedData.courses || [],
            assignments: importedData.assignments || [],
            settings: importedData.settings || {},
            metadata: importedData.metadata || {}
          });
          
          console.log('📥 Data imported successfully');
        } catch (error) {
          reject(new Error('Failed to parse backup file: ' + error.message));
        }
      };
      
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsText(file);
    });
  }

  // Clear all data
  static clearAllData() {
    if (confirm('Are you sure you want to clear all data? This cannot be undone!')) {
      Object.values(STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key);
      });
      console.log('🗑️ All data cleared');
      return true;
    }
    return false;
  }
}

export default DataManager;`;

fs.writeFileSync(path.join(process.cwd(), 'src/utils/DataManager.js'), dataManagerCode);
console.log('✅ Created DataManager utility');

// 2. Create SettingsModal component
const settingsModalCode = `import React, { useRef } from 'react';
import { X, Download, Upload, Trash2, Settings as SettingsIcon } from 'lucide-react';
import DataManager from '../utils/DataManager';

function SettingsModal({ isOpen, onClose, onImport, onClearData }) {
  const fileInputRef = useRef(null);

  if (!isOpen) return null;

  const handleExport = () => {
    const data = DataManager.loadAllData();
    DataManager.exportData(data.courses, data.assignments, data.settings);
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      try {
        const data = await DataManager.importData(file);
        onImport(data);
        alert('Data imported successfully!');
        onClose();
      } catch (error) {
        alert('Failed to import data: ' + error.message);
      }
    }
  };

  const handleClearData = () => {
    if (DataManager.clearAllData()) {
      onClearData();
      onClose();
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal-content settings-modal">
        <div className="modal-header">
          <h2 className="modal-title">
            <SettingsIcon size={20} />
            Settings
          </h2>
          <button onClick={onClose} className="modal-close">
            <X size={20} />
          </button>
        </div>

        <div className="settings-body">
          <div className="settings-section">
            <h3>Data Management</h3>
            <p className="settings-description">
              Backup your courses and assignments or transfer to another device.
            </p>
            
            <div className="settings-actions">
              <button onClick={handleExport} className="settings-btn">
                <Download size={16} />
                Export Data
              </button>
              
              <button onClick={handleImportClick} className="settings-btn">
                <Upload size={16} />
                Import Data
              </button>
              
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>
          </div>

          <div className="settings-section danger-zone">
            <h3>Danger Zone</h3>
            <p className="settings-description">
              Clear all data from this browser. This action cannot be undone.
            </p>
            
            <button onClick={handleClearData} className="settings-btn settings-btn-danger">
              <Trash2 size={16} />
              Clear All Data
            </button>
          </div>

          <div className="settings-footer">
            <p className="settings-note">
              Data is automatically saved to your browser's local storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsModal;`;

fs.writeFileSync(path.join(process.cwd(), 'src/components/SettingsModal.jsx'), settingsModalCode);
console.log('✅ Created SettingsModal component');

// 3. Create utils directory if it doesn't exist
const utilsDir = path.join(process.cwd(), 'src/utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
}

// 4. Update App.jsx with persistence hooks
const appUpdateCode = `// Add these imports at the top
import DataManager from './utils/DataManager'
import SettingsModal from './components/SettingsModal'

// Add this state after other states
const [showSettingsModal, setShowSettingsModal] = useState(false)

// Replace the useEffect with this enhanced version
useEffect(() => {
  // Load saved data or use defaults
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
    const testCourses = [/* existing test data */];
    const testAssignments = [/* existing test data */];
    setCourses(testCourses);
    setAssignments(testAssignments);
    console.log('📚 Initialized with test data');
  }
}, [])

// Add auto-save effect
useEffect(() => {
  // Save data whenever courses or assignments change
  if (courses.length > 0 || assignments.length > 0) {
    DataManager.saveAllData(courses, assignments);
  }
}, [courses, assignments])

// Add import handler
const handleDataImport = (importedData) => {
  setCourses(importedData.courses);
  setAssignments(importedData.assignments);
  setCalendarKey(prev => prev + 1);
  console.log('📥 Imported data:', {
    courses: importedData.courses.length,
    assignments: importedData.assignments.length
  });
}

// Add clear data handler
const handleClearData = () => {
  setCourses([]);
  setAssignments([]);
  setSelectedCourse('all');
  setCalendarKey(prev => prev + 1);
  window.location.reload(); // Refresh to reset state
}

// Update the Settings button in header
<button 
  className="btn"
  onClick={() => setShowSettingsModal(true)}
>
  <Settings size={16} />
  Settings
</button>

// Add SettingsModal before closing div
<SettingsModal
  isOpen={showSettingsModal}
  onClose={() => setShowSettingsModal(false)}
  onImport={handleDataImport}
  onClearData={handleClearData}
/>`;

console.log('\n📝 Manual App.jsx updates needed:');
console.log('1. Add imports for DataManager and SettingsModal');
console.log('2. Add showSettingsModal state');
console.log('3. Replace useEffect with persistence version');
console.log('4. Add auto-save effect');
console.log('5. Add import/clear handlers');
console.log('6. Add SettingsModal component\n');

// 5. Add CSS for settings
const settingsCss = `

/* ========== SETTINGS MODAL STYLES ========== */

.settings-modal {
  max-width: 500px;
}

.settings-body {
  padding: 1.5rem;
}

.settings-section {
  margin-bottom: 2rem;
  padding-bottom: 2rem;
  border-bottom: 1px solid #e5e7eb;
}

.settings-section:last-child {
  border-bottom: none;
  margin-bottom: 0;
  padding-bottom: 0;
}

.settings-section h3 {
  font-size: 1.125rem;
  font-weight: 600;
  margin: 0 0 0.5rem 0;
  color: #1f2937;
}

.settings-description {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 1rem 0;
  line-height: 1.5;
}

.settings-actions {
  display: flex;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.settings-btn {
  padding: 0.625rem 1.25rem;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 0.375rem;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  transition: all 0.2s;
}

.settings-btn:hover {
  background: #f9fafb;
  border-color: #9ca3af;
}

.settings-btn-danger {
  border-color: #fecaca;
  color: #dc2626;
}

.settings-btn-danger:hover {
  background: #fee2e2;
  border-color: #f87171;
}

.danger-zone h3 {
  color: #dc2626;
}

.settings-footer {
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.settings-note {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0;
  text-align: center;
}`;

const cssPath = path.join(process.cwd(), 'src/index.css');
const currentCSS = fs.readFileSync(cssPath, 'utf8');
fs.writeFileSync(cssPath, currentCSS + settingsCss);
console.log('✅ Added Settings CSS');

console.log('\n🎉 Data Persistence Structure Added!\n');
console.log('Next steps:');
console.log('1. Manually update App.jsx with the persistence code above');
console.log('2. Restart dev server');
console.log('3. Your data will auto-save and persist between sessions');
console.log('4. Use Settings → Export/Import for backups\n');
console.log('Features added:');
console.log('  • Auto-save to localStorage');
console.log('  • Export data as JSON file');
console.log('  • Import from backup file');
console.log('  • Clear all data option');
console.log('  • Subtle settings menu\n');
