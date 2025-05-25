import { NextRequest, NextResponse } from 'next/server';
import { readFile, writeFile, readdir, mkdir } from 'fs/promises';
import { join, basename, normalize, extname } from 'path';
import { existsSync } from 'fs';

// Helper function to create backup directory
async function ensureBackupDirectory(fileName: string): Promise<string> {
  const baseDir = join(process.cwd(), 'public', 'data');
  const backupDir = join(baseDir, 'backups', fileName.replace('.csv', ''));
  
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

    // Validate and sanitize the path to prevent directory traversal attacks
    const fileName = basename(csvPath);
    
    // Only allow CSV files
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // If action is 'versions', return list of backups
    if (action === 'versions') {
      try {
        const backupDir = await ensureBackupDirectory(fileName);
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

    // Default: serve the CSV file content
    const safePath = join(process.cwd(), 'public', 'data', fileName);
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

    // Validate and sanitize the path to prevent directory traversal attacks
    const fileName = basename(csvPath);
    
    // Only allow CSV files
    if (!fileName.endsWith('.csv')) {
      return NextResponse.json(
        { error: 'Only CSV files are allowed' },
        { status: 400 }
      );
    }

    // Construct safe path within the public/data directory
    const safePath = join(process.cwd(), 'public', 'data', fileName);
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

      const backupDir = await ensureBackupDirectory(fileName);
      const backupPath = join(backupDir, backupFileName);
      
      if (!existsSync(backupPath)) {
        return NextResponse.json(
          { error: 'Backup file not found' },
          { status: 404 }
        );
      }

      // Create a backup of current file before restoring
      if (existsSync(normalizedPath)) {
        await createBackup(normalizedPath, fileName);
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

    // Create backup of original file before saving changes
    let backupPath = '';
    try {
      backupPath = await createBackup(normalizedPath, fileName);
    } catch (error) {
      console.warn('Could not create backup:', error);
      // Continue with save operation even if backup fails
    }

    // Convert the data back to CSV format
    const csvLines = [
      headers.join(','),
      ...rows.map((row: string[]) => 
        row.map(cell => {
          // Escape cells that contain commas, quotes, or newlines
          if (cell.includes(',') || cell.includes('"') || cell.includes('\n')) {
            return `"${cell.replace(/"/g, '""')}"`;
          }
          return cell;
        }).join(',')
      )
    ];
    
    const csvContent = csvLines.join('\n');

    // Generate a new versioned filename for the edited content
    const editedFileName = generateTimestampedName(fileName);
    const editedPath = join(process.cwd(), 'public', 'data', editedFileName);

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
