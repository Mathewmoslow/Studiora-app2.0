import React, { useRef } from 'react';
import { X, Download, Upload, Trash2, Settings as SettingsIcon } from 'lucide-react';
import DataManager from '../utils/DataManager';
import StudyScheduler from '../services/StudyScheduler';


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

export default SettingsModal;