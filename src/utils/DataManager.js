// Data persistence manager for Studiora
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
    link.download = `studiora-backup-${new Date().toISOString().split('T')[0]}.json`;
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

export default DataManager;