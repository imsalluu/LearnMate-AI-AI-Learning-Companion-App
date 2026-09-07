export interface ChunkMetadata {
  materialId?: string;
  chunkIndex: number;
  pageNumber: number;
  sectionTitle?: string;
  tokenCount: number;
  charCount: number;
  source?: string;
}

export interface DocumentChunk {
  content: string;
  metadata: ChunkMetadata;
}

export interface ChunkerOptions {
  chunkSize?: number; // Approximate characters per chunk
  chunkOverlap?: number;
  separators?: string[];
}

export class SemanticChunker {
  private static defaultOptions: Required<ChunkerOptions> = {
    chunkSize: 800,
    chunkOverlap: 120,
    separators: ['\n\n', '\n', '. ', '? ', '! ', '; ', ' '],
  };

  /**
   * Cleans text from excessive whitespace, control characters, and null bytes
   */
  static cleanText(rawText: string): string {
    return rawText
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      .replace(/\t/g, ' ')
      .replace(/[ \t]{2,}/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  }

  /**
   * Splits a document into overlapping semantic chunks with rich metadata
   */
  static chunkDocument(
    text: string,
    options: ChunkerOptions = {},
    initialMetadata: { materialId?: string; source?: string; totalPages?: number } = {}
  ): DocumentChunk[] {
    const config = { ...this.defaultOptions, ...options };
    const cleaned = this.cleanText(text);

    if (!cleaned) return [];

    const chunks: DocumentChunk[] = [];
    const totalPages = initialMetadata.totalPages || 1;
    const approxCharsPerPage = Math.max(1, Math.floor(cleaned.length / totalPages));

    let startIndex = 0;
    let chunkIndex = 0;

    while (startIndex < cleaned.length) {
      let endIndex = startIndex + config.chunkSize;

      if (endIndex < cleaned.length) {
        // Find best separator near endIndex to avoid splitting words/sentences
        let splitFound = false;
        for (const sep of config.separators) {
          const lastIndex = cleaned.lastIndexOf(sep, endIndex);
          if (lastIndex > startIndex + config.chunkSize * 0.5) {
            endIndex = lastIndex + sep.length;
            splitFound = true;
            break;
          }
        }
        if (!splitFound) {
          // If no separator found, break at space
          const spaceIndex = cleaned.lastIndexOf(' ', endIndex);
          if (spaceIndex > startIndex) {
            endIndex = spaceIndex + 1;
          }
        }
      } else {
        endIndex = cleaned.length;
      }

      const chunkText = cleaned.slice(startIndex, endIndex).trim();

      if (chunkText.length > 20) {
        const estimatedPage = Math.min(
          totalPages,
          Math.max(1, Math.floor(startIndex / approxCharsPerPage) + 1)
        );

        // Estimate token count (~4 characters per token in English)
        const tokenCount = Math.ceil(chunkText.length / 4);

        // Extract potential section heading from first line
        const firstLine = chunkText.split('\n')[0].replace(/^#+\s*/, '').trim();
        const sectionTitle = firstLine.length < 60 ? firstLine : undefined;

        chunks.push({
          content: chunkText,
          metadata: {
            materialId: initialMetadata.materialId,
            chunkIndex,
            pageNumber: estimatedPage,
            sectionTitle,
            tokenCount,
            charCount: chunkText.length,
            source: initialMetadata.source,
          },
        });

        chunkIndex++;
      }

      // Advance start index accounting for overlap
      if (endIndex >= cleaned.length) break;
      startIndex = Math.max(startIndex + 1, endIndex - config.chunkOverlap);
    }

    return chunks;
  }
}
