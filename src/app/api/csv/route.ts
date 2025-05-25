import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join, basename, normalize } from 'path';
import { existsSync } from 'fs';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const csvPath = searchParams.get('path');
    console.log('CSV Path:', csvPath);

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
