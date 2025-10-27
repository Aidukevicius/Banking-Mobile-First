import pdfParse from 'pdf-parse/lib/pdf-parse.js';

export interface ParsedTransaction {
  date: string;
  description: string;
  provider: string;
  amount: number;
}

export async function parsePdfStatement(pdfBuffer: Buffer): Promise<ParsedTransaction[]> {
  try {
    console.log('Starting PDF parse, buffer size:', pdfBuffer.length);
    const data = await pdfParse(pdfBuffer);
    const text = data.text;
    console.log('PDF text extracted, length:', text.length);

    const transactions: ParsedTransaction[] = [];
    const lines = text.split('\n');

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      const dateMatch = trimmed.match(/(\d{4}-\d{2}-\d{2})/);
      const amountMatch = trimmed.match(/[-+]?\d+\.\d{2}/);

      if (dateMatch && amountMatch) {
        const parts = trimmed.split(/\s+/);
        const date = dateMatch[0];
        const amount = parseFloat(amountMatch[0]);

        let description = '';
        let provider = '';

        for (let i = 0; i < parts.length; i++) {
          if (!parts[i].match(/^\d{4}-\d{2}-\d{2}$/) && !parts[i].match(/^[-+]?\d+\.\d{2}$/)) {
            if (!provider) {
              provider = parts[i];
            }
            description += parts[i] + ' ';
          }
        }

        transactions.push({
          date,
          description: description.trim() || provider,
          provider: provider || 'Unknown',
          amount,
        });
      }
    }

    console.log('Parsed transactions:', transactions.length);
    return transactions;
  } catch (error: any) {
    console.error('PDF parsing error:', error);
    throw new Error('Failed to parse PDF: ' + (error.message || error));
  }
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