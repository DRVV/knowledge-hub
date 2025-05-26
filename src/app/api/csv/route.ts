import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join, basename, normalize, extname, dirname, sep } from 'path';
import { existsSync } from 'fs';
import Papa from 'papaparse';

// Helper function to validate and sanitize CSV path
function validateAndSanitizePath(csvPath: string): { isValid: boolean; sanitizedPath: string; fileName: string; relativePath: string } {
  if (!csvPath) {
    return { isValid: false, sanitizedPath: '', fileName: '', relativePath: '' };
  }

  // Remove leading slashes and normalize path
  let cleanPath = csvPath.replace(/^\/+/, '').replace(/\\/g, '/');
  
  // Ensure it ends with .csv
  if (!cleanPath.endsWith('.csv')) {
    return { isValid: false, sanitizedPath: '', fileName: '', relativePath: '' };
  }

  // Normalize and prevent directory traversal
  const normalizedPath = normalize(cleanPath).replace(/\\/g, '/');
  
  // Check for directory traversal attempts
  if (normalizedPath.includes('..') || normalizedPath.startsWith('/') || normalizedPath.includes('//')) {
    return { isValid: false, sanitizedPath: '', fileName: '', relativePath: '' };
  }

  // Extract filename and directory path
  const fileName = basename(normalizedPath);
  const relativePath = normalizedPath;

  return {
    isValid: true,
    sanitizedPath: normalizedPath,
    fileName,
    relativePath
  };
}

// Helper function to create backup directory preserving subdirectory structure
async function ensureBackupDirectory(relativePath: string): Promise<string> {
  const baseDir = join(process.cwd(), 'public', 'data');
  const fileDir = dirname(relativePath);
  const fileName = basename(relativePath, '.csv');
  
  // Create backup path that preserves subdirectory structure
  const backupDir = fileDir === '.' 
    ? join(baseDir, 'backups', fileName)
    : join(baseDir, 'backups', fileDir, fileName);
  
  if (!existsSync(backupDir)) {
    await mkdir(backupDir, { recursive: true });
  }
  
  return backupDir;
}

// Helper function to generate timestamped filename
function generateTimestampedName(fileName: string): string {
  const nameWithoutExt = fileName.replace('.csv', '');
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('.')[0];
  return `${nameWithoutExt}_${timestamp}.csv`;
}

// Helper function to ensure directory exists
async function ensureDirectoryExists(filePath: string): Promise<void> {
  const dir = dirname(filePath);
  if (!existsSync(dir)) {
    await mkdir(dir, { recursive: true });
  }
}

// Helper function to create backup before editing
async function createBackup(originalPath: string, fileName: string): Promise<string> {
  const backupDir = await ensureBackupDirectory(fileName);
  const backupFileName = generateTimestampedName(fileName);
  const backupPath = join(backupDir, backupFileName);
  
  if (existsSync(originalPath)) {
    const originalContent = await readFile(originalPath, 'utf-8');
    await writeFile(backupPath, originalContent, 'utf-8');
    console.log(`Backup created: ${backupPath}`);
    return backupPath;
  }
  
  throw new Error('Original file not found for backup');
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const csvPath = searchParams.get('path');
    const action = searchParams.get('action');
    console.log('CSV Path:', csvPath, 'Action:', action);

    if (!csvPath) {
      return NextResponse.json(
        { error: 'CSV path is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize the path to support subdirectories
    const pathValidation = validateAndSanitizePath(csvPath);
    
    if (!pathValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid CSV path. Only CSV files in subdirectories are allowed.' },
        { status: 400 }
      );
    }

    const { fileName, relativePath } = pathValidation;

    // If action is 'versions', return list of backups
    if (action === 'versions') {
      try {
        const backupDir = await ensureBackupDirectory(relativePath);
        const files = await readdir(backupDir);
        const backupFiles = files
          .filter(file => file.endsWith('.csv'))
          .map(file => {
            const stats = require('fs').statSync(join(backupDir, file));
            return {
              fileName: file,
              created: stats.birthtime,
              size: stats.size
            };
          })
          .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());

        return NextResponse.json(
          { backups: backupFiles },
          { status: 200 }
        );
      } catch (error) {
        return NextResponse.json(
          { backups: [] },
          { status: 200 }
        );
      }
    }

    // Default: serve the CSV file content using full relative path
    const safePath = join(process.cwd(), 'public', 'data', relativePath);
    const normalizedPath = normalize(safePath);
    
    // Ensure the path is still within the allowed directory
    const allowedDir = join(process.cwd(), 'public', 'data');
    if (!normalizedPath.startsWith(allowedDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    // Check if file exists
    if (!existsSync(normalizedPath)) {
      return NextResponse.json(
        { error: 'CSV file not found' },
        { status: 404 }
      );
    }

    // Read the actual CSV file
    const csvContent = await readFile(normalizedPath, 'utf-8');

    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error('Error serving CSV:', error);
    return NextResponse.json(
      { error: 'Failed to read CSV file' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const csvPath = searchParams.get('path');
    const action = searchParams.get('action') || 'save'; // 'save', 'restore'
    console.log('CSV Action:', action, 'Path:', csvPath);

    if (!csvPath) {
      return NextResponse.json(
        { error: 'CSV path is required' },
        { status: 400 }
      );
    }

    // Validate and sanitize the path to support subdirectories
    const pathValidation = validateAndSanitizePath(csvPath);
    
    if (!pathValidation.isValid) {
      return NextResponse.json(
        { error: 'Invalid CSV path. Only CSV files in subdirectories are allowed.' },
        { status: 400 }
      );
    }

    const { fileName, relativePath } = pathValidation;

    // Construct safe path within the public/data directory using full relative path
    const safePath = join(process.cwd(), 'public', 'data', relativePath);
    const normalizedPath = normalize(safePath);
    
    // Ensure the path is still within the allowed directory
    const allowedDir = join(process.cwd(), 'public', 'data');
    if (!normalizedPath.startsWith(allowedDir)) {
      return NextResponse.json(
        { error: 'Invalid file path' },
        { status: 400 }
      );
    }

    if (action === 'restore') {
      // Handle restore action
      const body = await request.json();
      const { backupFileName } = body;

      if (!backupFileName) {
        return NextResponse.json(
          { error: 'Backup filename is required for restore' },
          { status: 400 }
        );
      }

      const backupDir = await ensureBackupDirectory(relativePath);
      const backupPath = join(backupDir, backupFileName);
      
      if (!existsSync(backupPath)) {
        return NextResponse.json(
          { error: 'Backup file not found' },
          { status: 404 }
        );
      }

      // Create a backup of current file before restoring
      if (existsSync(normalizedPath)) {
        await createBackup(normalizedPath, relativePath);
      }

      // Restore from backup
      const backupContent = await readFile(backupPath, 'utf-8');
      await writeFile(normalizedPath, backupContent, 'utf-8');

      return NextResponse.json(
        { 
          message: 'CSV file restored successfully',
          restoredFrom: backupFileName
        },
        { status: 200 }
      );
    }

    // Handle save action (default)
    const body = await request.json();
    const { headers, rows } = body;

    if (!headers || !rows) {
      return NextResponse.json(
        { error: 'Invalid CSV data format. Expected headers and rows.' },
        { status: 400 }
      );
    }

    // Ensure the directory exists before saving
    await ensureDirectoryExists(normalizedPath);

    // Create backup of original file before saving changes
    let backupPath = '';
    try {
      backupPath = await createBackup(normalizedPath, relativePath);
    } catch (error) {
      console.warn('Could not create backup:', error);
      // Continue with save operation even if backup fails
    }

    // Convert the data back to CSV format using Papa Parse for proper escaping
    const csvData = [headers, ...rows];
    const csvContent = Papa.unparse(csvData, {
      quotes: true,
      quoteChar: '"',
      escapeChar: '"',
      delimiter: ',',
      header: false,
      newline: '\n'
    });

    // Generate a new versioned filename preserving subdirectory structure
    const fileDir = dirname(relativePath);
    const editedFileName = generateTimestampedName(fileName);
    const editedRelativePath = fileDir === '.' ? editedFileName : join(fileDir, editedFileName);
    const editedPath = join(process.cwd(), 'public', 'data', editedRelativePath);

    // Ensure the directory exists for the new versioned file
    await ensureDirectoryExists(editedPath);

    // Save the edited content as a new file
    await writeFile(editedPath, csvContent, 'utf-8');

    // Also update the original file for immediate use
    await writeFile(normalizedPath, csvContent, 'utf-8');

    return NextResponse.json(
      { 
        message: 'CSV file saved successfully',
        originalFile: fileName,
        editedFile: editedFileName,
        backupCreated: backupPath ? basename(backupPath) : null
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Error saving CSV:', error);
    return NextResponse.json(
      { error: 'Failed to save CSV file' },
      { status: 500 }
    );
  }
}
