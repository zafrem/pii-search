import { randomBytes } from 'crypto';

export const generateId = (): string => {
  return randomBytes(16).toString('hex');
};

export const escapeRegex = (string: string): string => {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
};

export const normalizeText = (text: string): string => {
  return text
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s@.-]/g, '');
};

export const calculateConfidence = (
  probability: number,
  contextScore: number = 0,
  validationScore: number = 0
): 'high' | 'medium' | 'low' => {
  const finalScore = probability * 0.6 + contextScore * 0.3 + validationScore * 0.1;
  
  if (finalScore >= 0.8) return 'high';
  if (finalScore >= 0.5) return 'medium';
  return 'low';
};

export const sanitizeInput = (input: string, maxLength: number = 10000): string => {
  if (!input || typeof input !== 'string') {
    throw new Error('Invalid input: must be a non-empty string');
  }

  const sanitized = input.trim();
  
  if (sanitized.length === 0) {
    throw new Error('Input cannot be empty');
  }

  if (sanitized.length > maxLength) {
    throw new Error(`Input exceeds maximum length of ${maxLength} characters`);
  }

  return sanitized;
};

export const isOverlapping = (
  pos1: { start: number; end: number },
  pos2: { start: number; end: number }
): boolean => {
  return pos1.start < pos2.end && pos2.start < pos1.end;
};

export const mergeOverlappingRanges = (
  ranges: { start: number; end: number }[]
): { start: number; end: number }[] => {
  if (ranges.length === 0) return [];

  const sorted = ranges.sort((a, b) => a.start - b.start);
  const merged: { start: number; end: number }[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const lastMerged = merged[merged.length - 1];

    if (current.start <= lastMerged.end) {
      lastMerged.end = Math.max(lastMerged.end, current.end);
    } else {
      merged.push(current);
    }
  }

  return merged;
};

export const extractContext = (
  text: string,
  position: { start: number; end: number },
  contextWindow: number = 50
): { before: string; after: string } => {
  const beforeStart = Math.max(0, position.start - contextWindow);
  const afterEnd = Math.min(text.length, position.end + contextWindow);

  return {
    before: text.substring(beforeStart, position.start).trim(),
    after: text.substring(position.end, afterEnd).trim()
  };
};

export const calculateTextSimilarity = (text1: string, text2: string): number => {
  const normalize = (str: string) => str.toLowerCase().replace(/\s+/g, ' ').trim();
  
  const s1 = normalize(text1);
  const s2 = normalize(text2);

  if (s1 === s2) return 1;

  const maxLength = Math.max(s1.length, s2.length);
  const editDistance = levenshteinDistance(s1, s2);
  
  return 1 - (editDistance / maxLength);
};

const levenshteinDistance = (str1: string, str2: string): number => {
  const matrix = Array.from({ length: str2.length + 1 }, (_, i) => [i]);
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
};