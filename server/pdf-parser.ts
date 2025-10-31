import { extractText, getDocumentProxy } from 'unpdf';

export interface ParsedTransaction {
  date: string;
  description: string;
  provider: string;
  amount: number;
}

export async function parsePdfStatement(pdfBuffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    console.log('Starting PDF parse, buffer size:', pdfBuffer.length);
    
    // Convert buffer to Uint8Array and extract text using unpdf
    const uint8Array = new Uint8Array(pdfBuffer);
    const pdf = await getDocumentProxy(uint8Array);
    const result = await extractText(pdf, { mergePages: true });
    const text = result.text;
    
    console.log('PDF text extracted, length:', text.length);
    console.log('PDF text preview:', text.substring(0, 500));

    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    // Try multiple parsing strategies, using each as fallback only if previous ones found nothing
    // This prevents combining duplicate results from multiple parsers
    const parsingStrategies = [
      { name: 'Revolut', fn: () => parseRevolutFormat(lines) },
      { name: 'Format1-YYYY-MM-DD', fn: () => parseFormatType1(lines) },
      { name: 'Format2-MM/DD/YYYY', fn: () => parseFormatType2(lines) },
      { name: 'Format3-DD-MMM-YYYY', fn: () => parseFormatType3(lines) },
      { name: 'Format4-MultiLine', fn: () => parseFormatType4(lines) },
      { name: 'Format5-Complex', fn: () => parseFormatType5(lines) },
      { name: 'Format6-European', fn: () => parseFormatType6(lines) },
      { name: 'Format7-CSV', fn: () => parseFormatType7(lines) },
      { name: 'Format8-Aggressive', fn: () => parseFormatType8(lines) },
      { name: 'Format9-ContextAware', fn: () => parseFormatType9(lines) },
      { name: 'Format10-WholeText', fn: () => parseFormatType10(text) },
    ];
    
    let filteredTransactions: ParsedTransaction[] = [];
    
    // Try each parser until one successfully finds valid transactions after filtering
    for (const strategy of parsingStrategies) {
      const results = strategy.fn();
      
      if (results.length === 0) {
        console.log(`${strategy.name}: found 0 raw transactions, trying next parser`);
        continue;
      }
      
      // Filter out page headers and metadata for this parser's results
      const validResults = results.filter(t => {
        // Validate date
        if (!isValidDate(t.date)) {
          console.log('Skipping invalid date:', t.date, 'for transaction:', t.description);
          return false;
        }
        
        const lowerDesc = t.description.toLowerCase();
        
        // Filter out common header/metadata patterns
        const headerPatterns = [
          'account transactions from',
          'date description money',
          'statement generated',
          'page of',
          'balance forward',
          'beginning balance',
          'ending balance',
          'previous balance',
          'current balance',
          'total credits',
          'total debits',
          'generated on',
          'revolut bank',
          'registered address',
        ];
        
        for (const pattern of headerPatterns) {
          if (lowerDesc.includes(pattern)) {
            console.log('Filtering out header/metadata:', t.description.substring(0, 50));
            return false;
          }
        }
        
        // Filter out very long descriptions (likely metadata)
        if (t.description.length > 150) {
          console.log('Filtering out overly long description:', t.description.substring(0, 50));
          return false;
        }
        
        return true;
      });
      
      // If this parser found valid transactions after filtering, use them
      if (validResults.length > 0) {
        console.log(`${strategy.name}: found ${results.length} raw, ${validResults.length} after filtering`);
        
        // Deduplicate by date, amount, AND description similarity
        const seen = new Map<string, ParsedTransaction>();
        
        for (const transaction of validResults) {
          // Create a more specific key that includes part of the description
          // This allows same amounts from different people on the same day
          const descriptionKey = transaction.description
            .toLowerCase()
            .replace(/[^a-z0-9]/g, '')
            .substring(0, 20); // First 20 chars of cleaned description
          
          const key = `${transaction.date}-${Math.abs(transaction.amount).toFixed(2)}-${descriptionKey}`;
          
          // If we've seen this exact combo (same date, amount, and similar description)
          if (seen.has(key)) {
            const existing = seen.get(key)!;
            
            // Prefer shorter, cleaner descriptions for true duplicates
            if (transaction.description.length < existing.description.length) {
              seen.set(key, transaction);
            }
          } else {
            seen.set(key, transaction);
          }
        }
        
        // Convert map values to array
        filteredTransactions = Array.from(seen.values());
        console.log(`${strategy.name}: ${filteredTransactions.length} unique transactions after deduplication`);
        break; // Stop trying other parsers
      } else {
        console.log(`${strategy.name}: found ${results.length} raw but 0 after filtering, trying next parser`);
      }
    }
    
    if (filteredTransactions.length === 0) {
      console.log('No valid transactions found by any parser');
    }

    // Push final results to transactions array
    transactions.push(...filteredTransactions);

    console.log('Parsed transactions:', transactions.length);
    if (transactions.length > 0) {
      console.log('Sample transaction:', JSON.stringify(transactions[0]));
    }
    
    return transactions;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF: ' + (error.message || error));
  }
}

// Validate date string
function isValidDate(dateStr: string): boolean {
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) {
    return false;
  }
  
  // Check if the date components are valid
  const parts = dateStr.split('-');
  if (parts.length !== 3) return false;
  
  const year = parseInt(parts[0]);
  const month = parseInt(parts[1]);
  const day = parseInt(parts[2]);
  
  if (year < 1900 || year > 2100) return false;
  if (month < 1 || month > 12) return false;
  if (day < 1 || day > 31) return false;
  
  // Verify the date is valid (e.g., not Feb 30)
  const testDate = new Date(year, month - 1, day);
  return testDate.getFullYear() === year && 
         testDate.getMonth() === month - 1 && 
         testDate.getDate() === day;
}

// Revolut-specific format parser
function parseRevolutFormat(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  // Keywords that indicate money IN (positive)
  const moneyInKeywords = [
    'top up', 'topup', 'top-up',
    'deposit', 'received', 'receive',
    'transfer from', 'from',
    'refund', 'cashback', 'reward',
    'income', 'salary', 'payment received',
    'credited', 'added'
  ];
  
  // Keywords that indicate money OUT (negative)
  const moneyOutKeywords = [
    'transfer to', 'to',
    'payment', 'purchase', 'card payment',
    'withdrawal', 'atm', 'withdraw',
    'fee', 'charge', 'debit',
    'sent', 'transfer out'
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    // Look for Revolut date patterns: "DD MMM YYYY" or "MMM DD, YYYY"
    const datePatterns = [
      /\b(\d{1,2})\s+(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{4})\b/i,
      /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+(\d{1,2}),?\s+(\d{4})\b/i,
    ];
    
    const monthMap: { [key: string]: string } = {
      'jan': '01', 'feb': '02', 'mar': '03', 'apr': '04',
      'may': '05', 'jun': '06', 'jul': '07', 'aug': '08',
      'sep': '09', 'oct': '10', 'nov': '11', 'dec': '12',
    };
    
    let dateMatch = null;
    let normalizedDate = '';
    
    for (const pattern of datePatterns) {
      const match = line.match(pattern);
      if (match) {
        dateMatch = match;
        if (pattern === datePatterns[0]) {
          // DD MMM YYYY
          const day = match[1].padStart(2, '0');
          const month = monthMap[match[2].toLowerCase().substring(0, 3)] || '01';
          const year = match[3];
          normalizedDate = `${year}-${month}-${day}`;
        } else {
          // MMM DD, YYYY
          const month = monthMap[match[1].toLowerCase().substring(0, 3)] || '01';
          const day = match[2].padStart(2, '0');
          const year = match[3];
          normalizedDate = `${year}-${month}-${day}`;
        }
        break;
      }
    }
    
    if (!dateMatch || !normalizedDate) continue;
    
    // Look for description and amount in current and next few lines
    let amount = null;
    let description = '';
    let fullContext = '';
    
    for (let j = 0; j <= 3 && i + j < lines.length; j++) {
      const checkLine = lines[i + j].trim();
      fullContext += ' ' + checkLine;
      
      // Match amounts: "123.45 RON", "1,234.56 EUR", etc.
      const amountMatch = checkLine.match(/(\d+(?:,\d{3})*\.\d{2})\s*(?:RON|EUR|USD|GBP|CHF|PLN|CZK|HUF)/i);
      
      if (amountMatch && amount === null) {
        const amountStr = amountMatch[1].replace(/,/g, '');
        amount = parseFloat(amountStr);
        
        // Extract description (text between date and amount, or from previous lines)
        if (j === 0) {
          const amountIndex = checkLine.indexOf(amountMatch[0]);
          const dateIndex = checkLine.indexOf(dateMatch[0]);
          if (dateIndex !== -1 && dateIndex < amountIndex) {
            description = checkLine.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
          } else {
            description = checkLine.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
          }
        } else {
          // Collect description from previous lines
          for (let k = i; k < i + j; k++) {
            const prevLine = lines[k].trim();
            const cleanedLine = prevLine.replace(dateMatch[0], '').trim();
            if (cleanedLine) {
              description += ' ' + cleanedLine;
            }
          }
          description = description.trim();
        }
        break;
      }
    }
    
    if (amount !== null && amount > 0) {
      // Determine transaction type based on description keywords
      const lowerDescription = fullContext.toLowerCase();
      let isMoneyIn = false;
      
      // Check for money IN keywords
      for (const keyword of moneyInKeywords) {
        if (lowerDescription.includes(keyword)) {
          isMoneyIn = true;
          break;
        }
      }
      
      // Check for money OUT keywords (only if not already identified as money in)
      if (!isMoneyIn) {
        for (const keyword of moneyOutKeywords) {
          if (lowerDescription.includes(keyword)) {
            isMoneyIn = false;
            break;
          }
        }
      }
      
      // Apply the sign
      if (!isMoneyIn) {
        amount = -Math.abs(amount); // Money out is negative
      } else {
        amount = Math.abs(amount); // Money in is positive
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

// Format 1: YYYY-MM-DD format
function parseFormatType1(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
    const amountMatch = trimmed.match(/[-+]?\$?\s*\d+[,.]?\d*\.\d{2}/);

    if (dateMatch && amountMatch) {
      const date = dateMatch[0];
      const amountStr = amountMatch[0].replace(/[\$\s,]/g, '');
      const amount = parseFloat(amountStr);

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
    if (!trimmed || trimmed.length < 10) continue;

    const dateMatch = trimmed.match(/(\d{1,2}\/\d{1,2}\/\d{4})/);
    const amountMatch = trimmed.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);

    if (dateMatch && amountMatch) {
      const dateParts = dateMatch[0].split('/');
      let month = dateParts[0].padStart(2, '0');
      let day = dateParts[1].padStart(2, '0');
      let year = dateParts[2];
      
      // Try DD/MM/YYYY if MM/DD/YYYY produces invalid date
      let date = `${year}-${month}-${day}`;
      if (!isValidDate(date)) {
        // Swap day and month
        date = `${year}-${day}-${month}`;
        if (!isValidDate(date)) {
          continue; // Skip this transaction
        }
      }
      
      const amountStr = amountMatch[0].replace(/[\$\s,]/g, '');
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

// Format 3: DD-MMM-YYYY or DD MMM YYYY
function parseFormatType3(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'january': '01', 'feb': '02', 'february': '02',
    'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
    'may': '05', 'jun': '06', 'june': '06',
    'jul': '07', 'july': '07', 'aug': '08', 'august': '08',
    'sep': '09', 'september': '09', 'oct': '10', 'october': '10',
    'nov': '11', 'november': '11', 'dec': '12', 'december': '12',
  };
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const dateMatch = trimmed.match(/(\d{1,2})[\s\-\/]([A-Za-z]{3,9})[\s\-\/](\d{2,4})/);
    const amountMatch = trimmed.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);

    if (dateMatch && amountMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const monthStr = dateMatch[2].toLowerCase();
      const month = monthMap[monthStr] || '01';
      let year = dateMatch[3];
      if (year.length === 2) {
        year = `20${year}`;
      }
      const date = `${year}-${month}-${day}`;
      
      const amountStr = amountMatch[0].replace(/[\$\s,]/g, '');
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

// Format 4: Multi-line or tabular format
function parseFormatType4(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 5) continue;
    
    const datePatterns = [
      /(\d{4}-\d{2}-\d{2})/,
      /(\d{1,2}\/\d{1,2}\/\d{4})/,
      /(\d{1,2})[\s\-\/]([A-Za-z]{3,9})[\s\-\/](\d{2,4})/,
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
    
    let amount = null;
    let description = '';
    
    for (let j = 0; j <= 3 && i + j < lines.length; j++) {
      const checkLine = lines[i + j].trim();
      const amountMatch = checkLine.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}/);
      
      if (amountMatch) {
        const amountStr = amountMatch[0].replace(/[\$\s,]/g, '');
        amount = parseFloat(amountStr);
        
        if (j === 0) {
          const dateIndex = checkLine.indexOf(dateMatch[0]);
          const amountIndex = checkLine.indexOf(amountMatch[0]);
          description = checkLine.substring(dateIndex + dateMatch[0].length, amountIndex).trim();
        } else {
          for (let k = 0; k < j; k++) {
            description += ' ' + lines[i + k].replace(dateMatch[0], '').trim();
          }
          description = description.trim();
        }
        break;
      }
    }
    
    if (amount !== null) {
      let normalizedDate = dateMatch[0];
      
      if (datePattern === datePatterns[1]) {
        const parts = dateMatch[0].split('/');
        normalizedDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      } else if (datePattern === datePatterns[2]) {
        const monthMap: { [key: string]: string } = {
          'jan': '01', 'january': '01', 'feb': '02', 'february': '02',
          'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
          'may': '05', 'jun': '06', 'june': '06',
          'jul': '07', 'july': '07', 'aug': '08', 'august': '08',
          'sep': '09', 'september': '09', 'oct': '10', 'october': '10',
          'nov': '11', 'november': '11', 'dec': '12', 'december': '12',
        };
        const day = dateMatch[1].padStart(2, '0');
        const month = monthMap[dateMatch[2].toLowerCase()] || '01';
        let year = dateMatch[3];
        if (year.length === 2) year = `20${year}`;
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

// Format 5: Complex bank statements with balance columns
function parseFormatType5(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 10) continue;
    
    if (line.toLowerCase().includes('date') && 
        (line.toLowerCase().includes('description') || line.toLowerCase().includes('details'))) {
      continue;
    }
    
    const parts = line.split(/\s{2,}|\t/);
    
    if (parts.length >= 3) {
      let dateStr = null;
      let description = null;
      let amountStr = null;
      
      for (let j = 0; j < parts.length; j++) {
        const part = parts[j].trim();
        
        if (/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/.test(part)) {
          dateStr = part;
          if (j + 1 < parts.length) {
            for (let k = j + 1; k < parts.length; k++) {
              const amountPart = parts[k].trim();
              if (/^[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.,]\d{2}$/.test(amountPart)) {
                amountStr = amountPart;
                description = parts.slice(j + 1, k).join(' ').trim();
                break;
              }
            }
          }
          break;
        }
      }
      
      if (dateStr && amountStr) {
        try {
          const dateParts = dateStr.split(/[\/\-]/);
          let normalizedDate: string;
          
          if (dateParts.length === 3) {
            const month = dateParts[0].padStart(2, '0');
            const day = dateParts[1].padStart(2, '0');
            const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
            normalizedDate = `${year}-${month}-${day}`;
          } else {
            continue;
          }
          
          const cleanAmount = amountStr.replace(/[\$\s,]/g, '');
          const amount = parseFloat(cleanAmount);
          
          if (!isNaN(amount) && description) {
            const provider = extractProvider(description);
            
            transactions.push({
              date: normalizedDate,
              description: description || 'Transaction',
              provider: provider || 'Unknown',
              amount,
            });
          }
        } catch (e) {
          continue;
        }
      }
    }
  }
  
  return transactions;
}

// Format 6: European format
function parseFormatType6(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;

    const dateMatch = trimmed.match(/(\d{1,2})[\.\/](\d{1,2})[\.\/](\d{4})/);
    const amountMatch = trimmed.match(/[-+]?\d{1,3}(?:[\s\.]\d{3})*,\d{2}/);

    if (dateMatch && amountMatch) {
      const day = dateMatch[1].padStart(2, '0');
      const month = dateMatch[2].padStart(2, '0');
      const year = dateMatch[3];
      const date = `${year}-${month}-${day}`;
      
      const amountStr = amountMatch[0].replace(/[\s\.]/g, '').replace(',', '.');
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

// Format 7: CSV-like format
function parseFormatType7(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 10) continue;
    
    const separators = [',', ';', '|', '\t'];
    
    for (const sep of separators) {
      if (trimmed.includes(sep)) {
        const parts = trimmed.split(sep).map(p => p.trim());
        
        if (parts.length >= 3) {
          let dateStr = null;
          let description = null;
          let amountStr = null;
          
          for (let i = 0; i < parts.length; i++) {
            const part = parts[i];
            
            if (!dateStr && /\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}/.test(part)) {
              dateStr = part;
            }
            else if (!amountStr && /^[-+]?\$?\s*\d{1,3}(?:[,\s\.]\d{3})*[,\.]\d{2}$/.test(part)) {
              amountStr = part;
            }
            else if (!description && part.length > 2 && !/^\d+$/.test(part)) {
              description = part;
            }
          }
          
          if (dateStr && amountStr) {
            try {
              const dateParts = dateStr.split(/[\/\-\.]/);
              let normalizedDate: string;
              
              if (dateParts.length === 3) {
                const month = dateParts[0].padStart(2, '0');
                const day = dateParts[1].padStart(2, '0');
                const year = dateParts[2].length === 2 ? `20${dateParts[2]}` : dateParts[2];
                normalizedDate = `${year}-${month}-${day}`;
              } else {
                continue;
              }
              
              let cleanAmount = amountStr.replace(/[\$\s]/g, '');
              if (cleanAmount.includes(',') && cleanAmount.includes('.')) {
                const lastComma = cleanAmount.lastIndexOf(',');
                const lastDot = cleanAmount.lastIndexOf('.');
                if (lastComma > lastDot) {
                  cleanAmount = cleanAmount.replace(/\./g, '').replace(',', '.');
                } else {
                  cleanAmount = cleanAmount.replace(/,/g, '');
                }
              } else if (cleanAmount.includes(',')) {
                cleanAmount = cleanAmount.replace(',', '.');
              }
              
              const amount = parseFloat(cleanAmount);
              
              if (!isNaN(amount) && description) {
                const provider = extractProvider(description);
                
                transactions.push({
                  date: normalizedDate,
                  description: description || 'Transaction',
                  provider: provider || 'Unknown',
                  amount,
                });
              }
            } catch (e) {
              continue;
            }
          }
        }
        break;
      }
    }
  }
  
  return transactions;
}

// Format 8: Aggressive line-by-line scan with relaxed matching
function parseFormatType8(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const monthMap: { [key: string]: string } = {
    'jan': '01', 'january': '01', 'feb': '02', 'february': '02',
    'mar': '03', 'march': '03', 'apr': '04', 'april': '04',
    'may': '05', 'jun': '06', 'june': '06',
    'jul': '07', 'july': '07', 'aug': '08', 'august': '08',
    'sep': '09', 'september': '09', 'oct': '10', 'october': '10',
    'nov': '11', 'november': '11', 'dec': '12', 'december': '12',
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.length < 8) continue;

    // Very relaxed date patterns - catch anything that looks like a date
    const allDatePatterns = [
      /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{2,4})\b/,  // 10/15/2025 or 15.10.25
      /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,    // 2025-10-15
      /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+(\d{2,4})\b/i, // 15 Oct 2025
    ];

    // Very relaxed amount patterns
    const allAmountPatterns = [
      /\$?\s*(\d{1,3}(?:[,\s]\d{3})*\.\d{2})/,  // $1,234.56
      /\$?\s*(\d+\.\d{2})\b/,                   // $45.99
      /\b(\d{1,3}(?:[,\s]\d{3})*,\d{2})\b/,     // European: 1.234,56
      /\((\d+\.\d{2})\)/,                        // (45.99) - negative
    ];

    let dateMatch = null;
    let dateValue = '';
    
    for (const pattern of allDatePatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        dateMatch = match;
        // Normalize date
        if (pattern === allDatePatterns[0]) {
          // MM/DD/YYYY or DD/MM/YYYY
          const p1 = match[1].padStart(2, '0');
          const p2 = match[2].padStart(2, '0');
          const p3 = match[3].length === 2 ? `20${match[3]}` : match[3];
          dateValue = `${p3}-${p1}-${p2}`;
        } else if (pattern === allDatePatterns[1]) {
          // YYYY-MM-DD
          dateValue = `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        } else if (pattern === allDatePatterns[2]) {
          // DD MMM YYYY
          const day = match[1].padStart(2, '0');
          const month = monthMap[match[2].toLowerCase()] || '01';
          const year = match[3].length === 2 ? `20${match[3]}` : match[3];
          dateValue = `${year}-${month}-${day}`;
        }
        break;
      }
    }

    if (!dateMatch) continue;

    let amountMatch = null;
    let amountValue = 0;
    
    for (const pattern of allAmountPatterns) {
      const match = trimmed.match(pattern);
      if (match) {
        amountMatch = match;
        let cleanAmount = match[1] || match[0];
        cleanAmount = cleanAmount.replace(/[\$\s,]/g, '');
        amountValue = parseFloat(cleanAmount);
        
        // Handle parentheses as negative
        if (pattern === allAmountPatterns[3]) {
          amountValue = -amountValue;
        }
        break;
      }
    }

    if (amountMatch && !isNaN(amountValue)) {
      const dateIdx = trimmed.indexOf(dateMatch[0]);
      const amountIdx = trimmed.indexOf(amountMatch[0]);
      
      let description = '';
      if (dateIdx < amountIdx) {
        description = trimmed.substring(dateIdx + dateMatch[0].length, amountIdx).trim();
      } else {
        description = trimmed.replace(dateMatch[0], '').replace(amountMatch[0], '').trim();
      }

      if (description.length > 2) {
        const provider = extractProvider(description);
        
        transactions.push({
          date: dateValue,
          description: description || 'Transaction',
          provider: provider || 'Unknown',
          amount: amountValue,
        });
      }
    }
  }

  return transactions;
}

// Format 9: Multi-line context-aware parsing
function parseFormatType9(lines: string[]): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const context: { date?: string; description?: string; amount?: number; lineNum?: number } = {};

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line || line.length < 3) continue;

    // Check if this line contains a date
    const dateMatch = line.match(/\b(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})\b/);
    if (dateMatch) {
      // Save previous transaction if we have all parts
      if (context.date && context.amount !== undefined) {
        const provider = extractProvider(context.description || '');
        transactions.push({
          date: context.date,
          description: context.description || 'Transaction',
          provider: provider || 'Unknown',
          amount: context.amount,
        });
      }

      // Start new context
      const parts = dateMatch[0].split(/[\/\-\.]/);
      if (parts[0].length === 4) {
        // YYYY-MM-DD
        context.date = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        // MM/DD/YYYY
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        context.date = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      context.description = line.replace(dateMatch[0], '').trim();
      context.lineNum = i;
    }

    // Check for amount in current or nearby lines
    const amountMatch = line.match(/[-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*[\.]\d{2}/);
    if (amountMatch && context.date && (i - (context.lineNum || 0) <= 2)) {
      const cleanAmount = amountMatch[0].replace(/[\$\s,]/g, '');
      context.amount = parseFloat(cleanAmount);
      
      // If description is empty, try to extract from this line
      if (!context.description || context.description.length < 3) {
        context.description = line.replace(amountMatch[0], '').trim();
      }
    }

    // If description seems to continue on next line
    if (context.date && !context.amount && i - (context.lineNum || 0) === 1) {
      if (!line.match(/\d{1,2}[\/\-\.]\d{1,2}/)) {  // Not a new date
        context.description = (context.description || '') + ' ' + line;
      }
    }
  }

  // Add last transaction if complete
  if (context.date && context.amount !== undefined) {
    const provider = extractProvider(context.description || '');
    transactions.push({
      date: context.date,
      description: context.description || 'Transaction',
      provider: provider || 'Unknown',
      amount: context.amount,
    });
  }

  return transactions;
}

// Format 10: Whole-text regex patterns for complex layouts
function parseFormatType10(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];

  // Pattern: Date ... Description ... Amount (anywhere in a chunk of text)
  const complexPattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4}|\d{4}[\/\-\.]\d{1,2}[\/\-\.]\d{1,2})([^$\d]*?)([-+]?\$?\s*\d{1,3}(?:[,\s]\d{3})*\.\d{2})/g;
  
  let match;
  while ((match = complexPattern.exec(text)) !== null) {
    const dateStr = match[1];
    const description = match[2].trim();
    const amountStr = match[3].replace(/[\$\s,]/g, '');
    
    if (description.length > 2 && description.length < 200) {
      // Parse date
      const parts = dateStr.split(/[\/\-\.]/);
      let normalizedDate: string;
      
      if (parts[0].length === 4) {
        normalizedDate = `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
      } else {
        const year = parts[2].length === 2 ? `20${parts[2]}` : parts[2];
        normalizedDate = `${year}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }

      const amount = parseFloat(amountStr);
      if (!isNaN(amount)) {
        const provider = extractProvider(description);
        
        transactions.push({
          date: normalizedDate,
          description: description || 'Transaction',
          provider: provider || 'Unknown',
          amount,
        });
      }
    }
  }

  return transactions;
}

function extractProvider(description: string): string {
  let provider = description
    .replace(/^(PURCHASE|PAYMENT|TRANSFER|DEPOSIT|WITHDRAWAL|DEBIT|CREDIT|POS|ATM|ONLINE|CARD)\s+/i, "")
    .replace(/\s+#\d+$/, "")
    .replace(/\s+\d{4,}$/, "")
    .replace(/\*+$/, "")
    .replace(/\s+\d{1,2}\/\d{1,2}$/, "")
    .replace(/\s+REF:.*$/i, "")
    .replace(/\s+AUTH:.*$/i, "")
    .trim();

  const words = provider.split(/\s+/).filter(w => w.length > 0);

  if (words.length > 4) {
    provider = words.slice(0, 3).join(" ");
  } else if (words.length > 2) {
    provider = words.slice(0, 2).join(" ");
  } else {
    provider = words.join(" ");
  }

  provider = provider
    .replace(/\s+(LLC|INC|CORP|LTD|CO|PLC|GMBH|LIMITED|COMPANY)$/i, "")
    .replace(/[^a-zA-Z0-9\s&'\-\.]/g, "")
    .trim();

  return provider || description.split(/\s+/)[0] || 'Unknown';
}
