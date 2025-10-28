
import { PDFParse } from 'pdf-parse';

export interface ParsedTransaction {
  date: string;
  description: string;
  provider: string;
  amount: number;
}

export async function parsePdfStatement(pdfBuffer: Buffer): Promise<ParsedTransaction[]> {
  let parser: PDFParse | null = null;
  
  try {
    console.log('Starting PDF parse, buffer size:', pdfBuffer.length);
    
    // Create PDFParse instance with the buffer
    parser = new PDFParse({ data: pdfBuffer });
    
    // Extract text from PDF
    const result = await parser.getText();
    const text = result.text;
    console.log('PDF text extracted, length:', text.length);

    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Try multiple parsing strategies
    const parsedTransactions = [
      ...parseFormatType1(lines), // Original format (YYYY-MM-DD)
      ...parseFormatType2(lines), // MM/DD/YYYY or DD/MM/YYYY
      ...parseFormatType3(lines), // DD-MMM-YYYY or similar
      ...parseFormatType4(lines), // Table format with separated columns
    ];

    // Deduplicate transactions (in case multiple parsers caught the same transaction)
    const seen = new Set<string>();
    for (const transaction of parsedTransactions) {
      const key = `${transaction.date}-${transaction.amount}-${transaction.description}`;
      if (!seen.has(key)) {
        seen.add(key);
        transactions.push(transaction);
      }
    }

    console.log('Parsed transactions:', transactions.length);
    
    return transactions;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF: ' + (error.message || error));
  } finally {
    // Ensure parser resources are always cleaned up
    if (parser) {
      await parser.destroy();
    }
  }
}

// Format 1: YYYY-MM-DD format (original test format)
function parseFormatType1(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
    const amountMatch = trimmed.match(/[-+]?\d+[\.,]\d{2}/);

    if (dateMatch && amountMatch) {
      const date = dateMatch[0];
      const amountStr = amountMatch[0].replace(',', '.');
      const amount = parseFloat(amountStr);

      // Extract description (everything between date and amount)
      const dateIndex = trimmed.indexOf(date);
      const amountIndex = trimmed.indexOf(amountMatch[0]);
      let description = trimmed.substring(dateIndex + date.length, amountIndex).trim();
      
      const provider = extractProvider(description);

      transactions.push({
        date,
        description: description || 'Transaction',
        provider: provider || 'Unknown',
        amount,
      });
    }
  }
  
  return transactions;
}

// Format 2: MM/DD/YYYY or DD/MM/YYYY
function parseFormatType2(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match MM/DD/YYYY or DD/MM/YYYY
    const dateMatch = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const amountMatch = trimmed.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);

    if (dateMatch && amountMatch) {
      const dateParts = dateMatch[0].split('/');
      // Assume MM/DD/YYYY format, convert to YYYY-MM-DD
      const month = dateParts[0].padStart(2, '0');
      const day = dateParts[1].padStart(2, '0');
      const year = dateParts[2];
      const date = `${year}-${month}-${day}`;
      
      const amountStr = amountMatch[0].replace(/[\$\s,]/g, '').replace(',', '.');
      const amount = parseFloat(amountStr);

      const dateIndex = trimmed.indexOf(dateMatch[0]);
      const amountIndex = trimmed.indexOf(amountMatch[0]);
      let description = trimmed.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
      
      const provider = extractProvider(description);

      transactions.push({
        date,
        description: description || 'Transaction',
        provider: provider || 'Unknown',
        amount,
      });
    }
  }
  
  return transactions;
}

// Format 3: DD-MMM-YYYY or DD MMM YYYY (e.g., 15-Oct-2025 or 15 Oct 2025)
function parseFormatType3(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
    'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
    'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Match DD-MMM-YYYY or DD MMM YYYY
    const dateMatch = trimmed.match(/(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{4})/);
    const amountMatch = trimmed.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);

    if (dateMatch && amountMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const monthStr = dateMatch[2].toLowerCase();
      const month = monthMap[monthStr] || '01';
      const year = dateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      const amountStr = amountMatch[0].replace(/[\$\s,]/g, '').replace(',', '.');
      const amount = parseFloat(amountStr);

      const dateIndex = trimmed.indexOf(dateMatch[0]);
      const amountIndex = trimmed.indexOf(amountMatch[0]);
      let description = trimmed.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
      
      const provider = extractProvider(description);

      transactions.push({
        date,
        description: description || 'Transaction',
        provider: provider || 'Unknown',
        amount,
      });
    }
  }
  
  return transactions;
}

// Format 4: Multi-line or tabular format (date, description, amount on separate lines or columns)
function parseFormatType4(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Look for patterns where date, description, and amount might be in fixed positions
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Try to find any date pattern
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2})[\s\-]([A-Za-z]{3})[\s\-](\d{4})/,
    ];
    
    let dateMatch = null;
    let datePattern = null;
    
    for (const pattern of datePatterns) {
      dateMatch = line.match(pattern);
      if (dateMatch) {
        datePattern = pattern;
        break;
      }
    }
    
    if (!dateMatch) continue;
    
    // Look for amount in current line or next few lines
    let amount = null;
    let description = '';
    
    for (let j = 0; j <= 2 && i + j < lines.length; j++) {
      const checkLine = lines[i + j].trim();
      const amountMatch = checkLine.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);
      
      if (amountMatch) {
        const amountStr = amountMatch[0].replace(/[\$\s,]/g, '').replace(',', '.');
        amount = parseFloat(amountStr);
        
        // Extract description from lines between date and amount
        if (j === 0) {
          // Same line
          const dateIndex = checkLine.indexOf(dateMatch[0]);
          const amountIndex = checkLine.indexOf(amountMatch[0]);
          description = checkLine.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        } else {
          // Different lines - combine them
          for (let k = 0; k < j; k++) {
            description += ' ' + lines[i + k].replace(dateMatch[0], '').trim();
          }
          description = description.trim();
        }
        break;
      }
    }
    
    if (amount !== null) {
      // Normalize date to YYYY-MM-DD
      let normalizedDate = dateMatch[0];
      
      if (datePattern === datePatterns[1]) {
        // MM/DD/YYYY
        const parts = dateMatch[0].split('/');
        normalizedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      } else if (datePattern === datePatterns[2]) {
        // DD-MMM-YYYY
        const monthMap: { [key: string]: string } = {
          'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
          'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
          'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = monthMap[dateMatch[2].toLowerCase()] || '01';
        const year = dateMatch[3];
        normalizedDate = `${year}-${month}-${day}`;
      }
      
      const provider = extractProvider(description);
      
      transactions.push({
        date: normalizedDate,
        description: description || 'Transaction',
        provider: provider || 'Unknown',
        amount,
      });
    }
  }
  
  return transactions;
}

function extractProvider(description: string): string {
  // Remove common prefixes and suffixes
  let provider = description
    .replace(/^(PURCHASE|PAYMENT|TRANSFER|DEPOSIT|WITHDRAWAL|DEBIT|CREDIT|POS|ATM|ONLINE)\s+/i, "")
    .replace(/\s+#\d+$/, "") // Remove transaction IDs
    .replace(/\s+\d{4,}$/, "") // Remove 4+ digit codes at end
    .replace(/\*+$/, "") // Remove asterisks
    .replace(/\s+\d{1,2}\/\d{1,2}$/, "") // Remove dates at end
    .trim();

  // Extract the main merchant name (first few words)
  const words = provider.split(/\s+/).filter(w => w.length > 0);

  // Take first 2-4 words depending on content
  if (words.length > 4) {
    provider = words.slice(0, 3).join(" ");
  } else if (words.length > 2) {
    provider = words.slice(0, 2).join(" ");
  } else {
    provider = words.join(" ");
  }

  // Clean up common patterns
  provider = provider
    .replace(/\s+(LLC|INC|CORP|LTD|CO|PLC|GMBH)$/i, "")
    .replace(/[^a-zA-Z0-9\s&'\-\.]/g, "")
    .trim();

  return provider || description.split(/\s+/)[0] || 'Unknown'; // Fallback to first word
}
