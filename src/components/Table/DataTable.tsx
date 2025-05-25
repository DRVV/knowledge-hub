'use client';

import React, { useState, useMemo, useCallback } from 'react';
import { ChevronUp, ChevronDown, Search, Download, Filter, Save, Edit3, X, Check, History } from 'lucide-react';
import { CSVData, formatCellValue } from '@/utils/csvParser';
import VersionManager from './VersionManager';

interface DataTableProps {
  data: CSVData;
  className?: string;
  maxHeight?: string;
  showSearch?: boolean;
  showExport?: boolean;
  editable?: boolean;
  onSave?: (data: CSVData) => Promise<void>;
  csvPath?: string;
}

interface SortConfig {
  key: number;
  direction: 'asc' | 'desc';
}

export default function DataTable({ 
  data, 
  className = '', 
  maxHeight = '400px',
  showSearch = true,
  showExport = true,
  editable = false,
  onSave,
  csvPath
}: DataTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Editing state
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedData, setEditedData] = useState<CSVData>(data);
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // Version management state
  const [showVersionManager, setShowVersionManager] = useState(false);

  // Sync edited data when data prop changes
  React.useEffect(() => {
    setEditedData(data);
  }, [data]);

  // Auto-resize textareas when entering edit mode
  React.useEffect(() => {
    if (isEditMode) {
      // Small delay to ensure textareas are rendered
      setTimeout(() => {
        const textareas = document.querySelectorAll('textarea');
        textareas.forEach(textarea => {
          textarea.style.height = 'auto';
          textarea.style.height = Math.max(32, textarea.scrollHeight) + 'px';
        });
      }, 10);
    }
  }, [isEditMode]);

  // Editing handlers
  const handleCellEdit = useCallback((rowIndex: number, colIndex: number, value: string) => {
    setEditedData(prev => {
      const newData = { ...prev };
      newData.rows = [...prev.rows];
      newData.rows[rowIndex] = [...prev.rows[rowIndex]];
      newData.rows[rowIndex][colIndex] = value;
      return newData;
    });
  }, []);

  const handleSave = useCallback(async () => {
    if (!onSave) return;
    
    setIsSaving(true);
    try {
      await onSave(editedData);
      setIsEditMode(false);
    } catch (error) {
      console.error('Failed to save data:', error);
      // Could add error handling here
    } finally {
      setIsSaving(false);
    }
  }, [editedData, onSave]);

  const handleCancelEdit = useCallback(() => {
    setEditedData(data);
    setIsEditMode(false);
    setEditingCell(null);
  }, [data]);

  // Version management handlers
  const handleRestore = useCallback(async (backupFileName: string) => {
    if (!csvPath) return;

    try {
      const response = await fetch(`/api/csv?path=${encodeURIComponent(csvPath)}&action=restore`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ backupFileName }),
      });

      if (!response.ok) {
        throw new Error('Failed to restore backup');
      }

      // Refresh the data by calling onSave with current data to trigger a refresh
      if (onSave) {
        window.location.reload(); // Simple way to refresh the data
      }
    } catch (error) {
      console.error('Failed to restore backup:', error);
      throw error;
    }
  }, [csvPath, onSave]);

  // Filter data based on search term
  const filteredData = useMemo(() => {
    if (!searchTerm) return data.rows;
    
    return data.rows.filter(row =>
      row.some(cell =>
        cell.toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data.rows, searchTerm]);

  // Sort data
  const sortedData = useMemo(() => {
    if (!sortConfig) return filteredData;

    return [...filteredData].sort((a, b) => {
      const aVal = a[sortConfig.key];
      const bVal = b[sortConfig.key];
      
      // Try to parse as numbers for better sorting
      const aNum = parseFloat(aVal);
      const bNum = parseFloat(bVal);
      
      let comparison = 0;
      if (!isNaN(aNum) && !isNaN(bNum)) {
        comparison = aNum - bNum;
      } else {
        comparison = aVal.localeCompare(bVal);
      }
      
      return sortConfig.direction === 'desc' ? -comparison : comparison;
    });
  }, [filteredData, sortConfig]);

  // Paginate data
  const paginatedData = useMemo(() => {
    const startIndex = (currentPage - 1) * rowsPerPage;
    return sortedData.slice(startIndex, startIndex + rowsPerPage);
  }, [sortedData, currentPage, rowsPerPage]);

  const totalPages = Math.ceil(sortedData.length / rowsPerPage);

  const handleSort = (columnIndex: number) => {
    setSortConfig(prevConfig => {
      if (prevConfig?.key === columnIndex) {
        return {
          key: columnIndex,
          direction: prevConfig.direction === 'asc' ? 'desc' : 'asc'
        };
      }
      return { key: columnIndex, direction: 'asc' };
    });
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      data.headers.join(','),
      ...data.rows.map(row => row.join(','))
    ].join('\n');

    // Create blob and download
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'table-data.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (columnIndex: number) => {
    if (sortConfig?.key !== columnIndex) {
      return <ChevronUp className="w-4 h-4 text-gray-400" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ChevronUp className="w-4 h-4 text-blue-600" />
      : <ChevronDown className="w-4 h-4 text-blue-600" />;
  };

  if (!data.headers.length) {
    return (
      <div className={`bg-white rounded-lg border ${className}`}>
        <div className="p-8 text-center">
          <div className="text-gray-400 mb-2">
            <Filter className="w-8 h-8 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-1">No data available</h3>
          <p className="text-gray-500">No table data found for this graph.</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg border ${className}`}>
      {/* Header Controls */}
      {(showSearch || showExport) && (
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center space-x-4">
            {showSearch && (
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search table data..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500 text-sm"
                />
              </div>
            )}
            <div className="text-sm text-gray-500">
              {sortedData.length} {sortedData.length === 1 ? 'row' : 'rows'}
            </div>
          </div>
          
          <div className="flex items-center space-x-2">
            {editable && (
              <>
                {!isEditMode ? (
                  <button
                    onClick={() => setIsEditMode(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Edit3 className="w-4 h-4" />
                    <span>Edit</span>
                  </button>
                ) : (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-3 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {isSaving ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                      <span>{isSaving ? 'Saving...' : 'Save'}</span>
                    </button>
                    <button
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                      className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </>
                )}
                {csvPath && (
                  <button
                    onClick={() => setShowVersionManager(true)}
                    className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
                    title="View version history"
                  >
                    <History className="w-4 h-4" />
                    <span>History</span>
                  </button>
                )}
              </>
            )}
            {showExport && (
              <button
                onClick={handleExport}
                className="flex items-center space-x-2 px-3 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Table Container */}
      <div className="flex flex-col flex-1 min-h-0">
        {/* Table Header */}
        <div className="bg-gray-50 border-b border-gray-200">
          <table className="w-full table-fixed">
            <thead>
              <tr>
                {data.headers.map((header, index) => (
                  <th
                    key={index}
                    onClick={() => handleSort(index)}
                    className="px-3 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 select-none truncate"
                    style={{ width: `${100 / data.headers.length}%` }}
                    title={header}
                  >
                    <div className="flex items-center space-x-1">
                      <span className="truncate">{header}</span>
                      {getSortIcon(index)}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
          </table>
        </div>
        
        {/* Scrollable Table Body */}
        <div 
          className="flex-1 overflow-auto bg-white"
          style={{ 
            maxHeight: maxHeight === '100%' ? 'calc(100% - 120px)' : `calc(${maxHeight} - 60px)`
          }}
        >
          <table className="w-full table-fixed">
            <tbody className="divide-y divide-gray-200">
              {(isEditMode ? editedData.rows : paginatedData).slice(0, rowsPerPage).map((row, rowIndex) => {
                const actualRowIndex = isEditMode ? rowIndex : (currentPage - 1) * rowsPerPage + rowIndex;
                return (
                  <tr key={rowIndex} className="hover:bg-gray-50">
                    {row.map((cell, cellIndex) => (
                      <td
                        key={cellIndex}
                        className="px-3 py-4 text-sm text-gray-900"
                        style={{ width: `${100 / data.headers.length}%` }}
                      >
                        {isEditMode ? (
                          <textarea
                            value={cell}
                            onChange={(e) => handleCellEdit(actualRowIndex, cellIndex, e.target.value)}
                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500 resize-none overflow-hidden min-h-[2rem]"
                            onFocus={() => setEditingCell({row: actualRowIndex, col: cellIndex})}
                            onBlur={() => setEditingCell(null)}
                            rows={1}
                            style={{
                              height: 'auto',
                              minHeight: '2rem'
                            }}
                            onInput={(e) => {
                              const target = e.target as HTMLTextAreaElement;
                              target.style.height = 'auto';
                              target.style.height = Math.max(32, target.scrollHeight) + 'px';
                            }}
                          />
                        ) : (
                          <div className="whitespace-pre-wrap break-words" title={cell}>
                            {formatCellValue(cell)}
                          </div>
                        )}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t bg-gray-50 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <select
              value={rowsPerPage}
              onChange={(e) => {
                setRowsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1"
            >
              <option value={5}>5 per page</option>
              <option value={10}>10 per page</option>
              <option value={25}>25 per page</option>
              <option value={50}>50 per page</option>
            </select>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-700">
              Page {currentPage} of {totalPages}
            </span>
            <div className="flex space-x-1">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Version Manager Modal */}
      <VersionManager
        csvPath={csvPath || ''}
        isOpen={showVersionManager}
        onClose={() => setShowVersionManager(false)}
        onRestore={handleRestore}
      />
    </div>
  );
}
