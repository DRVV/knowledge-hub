import { NextRequest, NextResponse } from 'next/server';
import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const csvPath = searchParams.get('path');

    if (!csvPath) {
      return NextResponse.json(
        { error: 'CSV path is required' },
        { status: 400 }
      );
    }

    // For demonstration, we'll serve sample CSV data
    // In a real application, you would read from the actual file system
    // and implement proper security measures to prevent path traversal attacks
    
    // Sample CSV data for demonstration
    const sampleCSV = `ID,Event,Type,Date,Impact Score,Description
1,COVID-19 Pandemic,external-shock,2020-03-01,9.5,Global pandemic disrupting manufacturing
2,Factory Shutdowns,operational-impact,2020-04-01,8.7,Manufacturing plants closed in Asia
3,Increased Demand,market-demand,2020-06-01,7.2,Rising demand for electronics
4,Global Chip Shortage,supply-shortage,2021-01-01,9.0,Widespread shortage affecting industries
5,Supply Chain Recovery,recovery,2022-01-01,6.5,Gradual recovery of supply chains
6,New Manufacturing Capacity,expansion,2023-01-01,7.8,Investment in new facilities`;

    // In a real implementation, you would:
    // 1. Validate the path to prevent directory traversal
    // 2. Check user permissions
    // 3. Read the actual file
    // const safePath = join(process.cwd(), 'data', 'csv', basename(csvPath));
    // const csvContent = await readFile(safePath, 'utf-8');

    return new NextResponse(sampleCSV, {
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
