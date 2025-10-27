export interface ParsedTransaction {
  date: string;
  description: string;
  provider: string;
  amount: number;
}

export async function parsePdfStatement(buffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    const pdfParse = await import("pdf-parse");
    const pdf = pdfParse.default || pdfParse;
    const data = await pdf(buffer);
    const text = data.text;
    
    return extractTransactions(text);
  } catch (error) {
    console.error("PDF parsing error:", error);
    throw new Error("Failed to parse PDF");
  }
}

function extractTransactions(text: string): ParsedTransaction[] {
  const transactions: ParsedTransaction[] = [];
  const lines = text.split("\n");
  
  // Common bank statement patterns
  // Pattern 1: Date Description Amount (e.g., "10/25/2024 WHOLE FOODS MARKET -85.42")
  const pattern1 = /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-+]?\d+[,.]?\d*\.?\d{2})$/;
  
  // Pattern 2: Date Description Amount with optional reference (e.g., "2024-10-25 AMAZON.COM #12345 -125.99")
  const pattern2 = /(\d{4}-\d{2}-\d{2})\s+(.+?)\s+([-+]?\d+[,.]?\d*\.?\d{2})$/;
  
  // Pattern 3: DD/MM/YYYY format (e.g., "25/10/2024 SHELL GAS STATION -45.00")
  const pattern3 = /(\d{1,2}\/\d{1,2}\/\d{4})\s+(.+?)\s+([-+]?\d+[,.]?\d*\.?\d{2})$/;
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    if (!trimmedLine) continue;
    
    let match = trimmedLine.match(pattern1) || trimmedLine.match(pattern2) || trimmedLine.match(pattern3);
    
    if (match) {
      const [, dateStr, descriptionFull, amountStr] = match;
      
      // Parse date
      let date: Date;
      if (dateStr.includes("-")) {
        // YYYY-MM-DD format
        date = new Date(dateStr);
      } else {
        // MM/DD/YYYY or DD/MM/YYYY format
        const parts = dateStr.split("/");
        // Assume MM/DD/YYYY for US banks
        date = new Date(parseInt(parts[2]), parseInt(parts[0]) - 1, parseInt(parts[1]));
      }
      
      // Clean up description and extract provider
      const description = descriptionFull.trim();
      const provider = extractProvider(description);
      
      // Parse amount (remove commas, handle negative)
      const amount = parseFloat(amountStr.replace(/,/g, ""));
      
      if (!isNaN(date.getTime()) && !isNaN(amount) && provider) {
        transactions.push({
          date: date.toISOString().split("T")[0],
          description: description,
          provider: provider,
          amount: amount,
        });
      }
    }
  }
  
  return transactions;
}

function extractProvider(description: string): string {
  // Remove common prefixes and suffixes
  let provider = description
    .replace(/^(PURCHASE|PAYMENT|TRANSFER|DEPOSIT|WITHDRAWAL|DEBIT|CREDIT)\s+/i, "")
    .replace(/\s+#\d+$/, "") // Remove transaction IDs
    .replace(/\s+\d{4}$/, "") // Remove 4-digit codes at end
    .replace(/\*+$/, "") // Remove asterisks
    .trim();
  
  // Extract the main merchant name (first few words)
  const words = provider.split(/\s+/);
  
  // Take first 2-4 words depending on content
  if (words.length > 4) {
    provider = words.slice(0, 3).join(" ");
  } else if (words.length > 2) {
    provider = words.slice(0, 2).join(" ");
  }
  
  // Clean up common patterns
  provider = provider
    .replace(/\s+(LLC|INC|CORP|LTD|CO)$/i, "")
    .replace(/[^a-zA-Z0-9\s&'-]/g, "")
    .trim();
  
  return provider || description.split(" ")[0]; // Fallback to first word
}
