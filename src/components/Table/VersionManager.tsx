'use client';

import React, { useState, useEffect } from 'react';
import { History, RotateCcw, Clock, FileText, X, AlertTriangle } from 'lucide-react';

interface BackupFile {
  fileName: string;
  created: string;
  size: number;
}

interface VersionManagerProps {
  csvPath: string;
  isOpen: boolean;
  onClose: () => void;
  onRestore: (backupFileName: string) => Promise<void>;
}

export default function VersionManager({ csvPath, isOpen, onClose, onRestore }: VersionManagerProps) {
  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [restoring, setRestoring] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && csvPath) {
      fetchBackups();
    }
  }, [isOpen, csvPath]);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/csv?path=${encodeURIComponent(csvPath)}&action=versions`);
      if (response.ok) {
        const data = await response.json();
        setBackups(data.backups || []);
      } else {
        console.error('Failed to fetch backups');
        setBackups([]);
      }
    } catch (error) {
      console.error('Error fetching backups:', error);
      setBackups([]);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async (backupFileName: string) => {
    setRestoring(backupFileName);
    try {
      await onRestore(backupFileName);
      onClose();
    } catch (error) {
      console.error('Failed to restore backup:', error);
    } finally {
      setRestoring(null);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getBackupDescription = (fileName: string): string => {
    const timestamp = fileName.split('_').pop()?.replace('.csv', '') || '';
    return `Backup from ${formatDate(timestamp.replace(/-/g, ':'))}`;
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <div className="flex items-center space-x-3">
            <History className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-gray-900">Version History</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading backups...</span>
            </div>
          ) : backups.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <FileText className="w-12 h-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Backups Available</h3>
              <p className="text-gray-500">
                No backup versions found for this file. Backups are created automatically when you save changes.
              </p>
            </div>
          ) : (
            <div className="overflow-y-auto max-h-96">
              <div className="p-6 space-y-4">
                {backups.map((backup, index) => (
                  <div
                    key={backup.fileName}
                    className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-1">
                      <div className="flex items-center space-x-3">
                        <Clock className="w-4 h-4 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            {index === 0 ? 'Latest Backup' : `Backup ${backups.length - index}`}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(backup.created)}
                          </p>
                          <p className="text-xs text-gray-400">
                            {formatFileSize(backup.size)}
                          </p>
                        </div>
                      </div>
                    </div>
                    
                    <button
                      onClick={() => handleRestore(backup.fileName)}
                      disabled={restoring === backup.fileName}
                      className="flex items-center space-x-2 px-4 py-2 text-sm border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                      {restoring === backup.fileName ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
                          <span>Restoring...</span>
                        </>
                      ) : (
                        <>
                          <RotateCcw className="w-4 h-4" />
                          <span>Restore</span>
                        </>
                      )}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {backups.length > 0 && (
          <div className="p-6 border-t bg-gray-50">
            <div className="flex items-start space-x-2 text-sm text-gray-600">
              <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-medium">Important:</p>
                <p>
                  Restoring a backup will create a new backup of your current changes before applying the selected version.
                  This ensures you can always recover your work.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
