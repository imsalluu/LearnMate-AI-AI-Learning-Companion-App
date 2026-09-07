import { describe, it, expect } from 'vitest';
import { SemanticChunker } from '../src/modules/materials/chunker';

describe('Semantic Chunker & Text Processing', () => {
  const sampleLectureText = `
# Chapter 1: Introduction to Relational Databases
A database is an organized collection of structured information, or data, typically stored electronically in a computer system.

## 1.1 Database Normalization
Normalization is the process of organizing data in a database. This includes creating tables and establishing relationships between those tables according to rules designed both to protect the data and to make the database more flexible by eliminating redundancy and inconsistent dependency.

### First Normal Form (1NF)
Each column should contain atomic values. There should not be repeating groups or arrays.

### Second Normal Form (2NF)
The table must be in 1NF, and all non-key attributes must be fully functionally dependent on the primary key.

### Third Normal Form (3NF)
The table must be in 2NF, and there must be no transitive functional dependencies.
`;

  it('should clean text removing excessive whitespace', () => {
    const raw = 'Hello   world!\r\n\r\n\r\nThis   is  a test.  ';
    const cleaned = SemanticChunker.cleanText(raw);
    expect(cleaned).toBe('Hello world!\n\nThis is a test.');
  });

  it('should chunk document into semantic chunks with metadata', () => {
    const chunks = SemanticChunker.chunkDocument(
      sampleLectureText,
      { chunkSize: 300, chunkOverlap: 50 },
      { source: 'Lecture1.txt', totalPages: 2 }
    );

    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks[0].content).toBeDefined();
    expect(chunks[0].metadata.chunkIndex).toBe(0);
    expect(chunks[0].metadata.source).toBe('Lecture1.txt');
    expect(chunks[0].metadata.pageNumber).toBeGreaterThanOrEqual(1);
    expect(chunks[0].metadata.tokenCount).toBeGreaterThan(0);
  });
});
