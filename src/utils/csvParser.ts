/**
 * CSV Parser utility for reading and parsing CSV files
 */

export interface CSVData {
  headers: string[];
  rows: string[][];
}

export async function parseCSV(csvPath: string): Promise<CSVData> {
  try {
    // In a real application, you might want to fetch from a file server
    // For now, we'll simulate reading from the file system
    const response = await fetch(`/api/csv?path=${encodeURIComponent(csvPath)}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.statusText}`);
    }
    
    const csvText = await response.text();
    return parseCSVText(csvText);
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw error;
  }
}

export function parseCSVText(csvText: string): CSVData {
  const lines = csvText.trim().split('\n');
  
  if (lines.length === 0) {
    return { headers: [], rows: [] };
  }
  
  // Parse CSV (simple implementation - doesn't handle quoted fields with commas)
  const parseCSVLine = (line: string): string[] => {
    return line.split(',').map(cell => cell.trim().replace(/^"(.*)"$/, '$1'));
  };
  
  const headers = parseCSVLine(lines[0]);
  const rows = lines.slice(1).map(parseCSVLine);
  
  return { headers, rows };
}

export function formatCellValue(value: string): string {
  // Basic formatting for different data types
  if (!value || value === '') return '';
  
  // Check if it's a number
  const numValue = parseFloat(value);
  if (!isNaN(numValue) && isFinite(numValue)) {
    // Format numbers with appropriate decimal places
    return numValue % 1 === 0 ? numValue.toString() : numValue.toFixed(2);
  }
  
  return value;
}

// Generate sample CSV data for demonstration purposes
export function generateSampleCSVData(): CSVData {
  return {
    headers: ['ID', 'Event', 'Type', 'Date', 'Impact Score', 'Description'],
    rows: [
      ['1', 'COVID-19 Pandemic', 'external-shock', '2020-03-01', '9.5', 'Global pandemic disrupting manufacturing'],
      ['2', 'Factory Shutdowns', 'operational-impact', '2020-04-01', '8.7', 'Manufacturing plants closed in Asia'],
      ['3', 'Increased Demand', 'market-demand', '2020-06-01', '7.2', 'Rising demand for electronics'],
      ['4', 'Global Chip Shortage', 'supply-shortage', '2021-01-01', '9.0', 'Widespread shortage affecting industries'],
      ['5', 'Supply Chain Recovery', 'recovery', '2022-01-01', '6.5', 'Gradual recovery of supply chains'],
      ['6', 'New Manufacturing Capacity', 'expansion', '2023-01-01', '7.8', 'Investment in new facilities']
    ]
  };
}
