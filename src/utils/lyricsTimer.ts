/**
 * Lyrics Timing Parser and Synchronization Utility
 * Parses timing indicators like [0:05], [00:15.5], [1:23] from song lyrics
 * and provides real-time active lyric matching, auto-timing, and cleaning tools.
 */

export interface ParsedTimedLine {
  id: string;
  originalText: string;
  cleanText: string;
  timeSeconds: number | null;
  timeFormatted: string | null;
  isMetaTag: boolean;
  isParenCue: boolean;
  blockIndex: number;
  lineIndex: number;
}

export interface ParsedTimedBlock {
  blockIndex: number;
  hasMetaTag: boolean;
  blockTitle?: string;
  lines: ParsedTimedLine[];
}

export interface LyricsParseResult {
  blocks: ParsedTimedBlock[];
  timedLines: ParsedTimedLine[];
  hasTimings: boolean;
  totalLines: number;
}

/**
 * Parses timestamp from text like [0:05], [00:15.5], (1:23), etc.
 */
export const extractTimingIndicator = (
  text: string
): { timeSeconds: number; formatted: string; matchedStr: string } | null => {
  // Matches [0:05], [00:05], [1:23], [01:23.50], (0:05)
  const regex = /(?:\[|\()(\d{1,2}):(\d{2})(?:\.(\d{1,3}))?(?:\]|\))/;
  const match = text.match(regex);
  if (!match) return null;

  const minutes = parseInt(match[1], 10);
  const seconds = parseInt(match[2], 10);
  const millis = match[3] ? parseFloat(`0.${match[3]}`) : 0;
  const totalSeconds = minutes * 60 + seconds + millis;

  const formatted = `${match[1]}:${match[2].padStart(2, '0')}`;

  return {
    timeSeconds: totalSeconds,
    formatted,
    matchedStr: match[0],
  };
};

/**
 * Parses entire lyrics string into blocks and lines with timing metadata
 */
export const parseLyricsWithTimings = (lyrics: string): LyricsParseResult => {
  if (!lyrics || !lyrics.trim()) {
    return { blocks: [], timedLines: [], hasTimings: false, totalLines: 0 };
  }

  const rawBlocks = lyrics.split(/\n\s*\n/);
  const blocks: ParsedTimedBlock[] = [];
  const timedLines: ParsedTimedLine[] = [];
  let lineGlobalCounter = 0;

  rawBlocks.forEach((rawBlock, blockIdx) => {
    const rawLines = rawBlock.split('\n');
    const parsedLines: ParsedTimedLine[] = [];
    let blockHasMetaTag = false;
    let blockTitle: string | undefined = undefined;

    rawLines.forEach((rawLine, lineIdx) => {
      const trimmed = rawLine.trim();
      if (!trimmed) return;

      lineGlobalCounter++;
      const id = `lyric-line-${blockIdx}-${lineIdx}-${lineGlobalCounter}`;

      const timing = extractTimingIndicator(trimmed);

      let clean = trimmed;
      let timeSeconds: number | null = null;
      let timeFormatted: string | null = null;

      if (timing) {
        clean = trimmed.replace(timing.matchedStr, '').trim();
        timeSeconds = timing.timeSeconds;
        timeFormatted = timing.formatted;
      }

      // Check if clean text is a structural meta-tag e.g. [Intro], [Chorus], [Verse 1]
      const isMeta = clean.startsWith('[') && clean.endsWith(']');
      // Check if clean text is an instrumental/audio cue e.g. (Soft guitar solo)
      const isParen = clean.startsWith('(') && clean.endsWith(')');

      if (isMeta) {
        blockHasMetaTag = true;
        if (!blockTitle) blockTitle = clean;
      }

      const lineObj: ParsedTimedLine = {
        id,
        originalText: trimmed,
        cleanText: clean || trimmed,
        timeSeconds,
        timeFormatted,
        isMetaTag: isMeta,
        isParenCue: isParen,
        blockIndex: blockIdx,
        lineIndex: lineIdx,
      };

      parsedLines.push(lineObj);

      if (timeSeconds !== null) {
        timedLines.push(lineObj);
      }
    });

    if (parsedLines.length > 0) {
      blocks.push({
        blockIndex: blockIdx,
        hasMetaTag: blockHasMetaTag,
        blockTitle,
        lines: parsedLines,
      });
    }
  });

  // Sort timed lines by timeSeconds ascending
  timedLines.sort((a, b) => (a.timeSeconds ?? 0) - (b.timeSeconds ?? 0));

  return {
    blocks,
    timedLines,
    hasTimings: timedLines.length > 0,
    totalLines: lineGlobalCounter,
  };
};

/**
 * Finds the currently active timed line given elapsed audio seconds
 */
export const findActiveTimedLine = (
  timedLines: ParsedTimedLine[],
  currentTimeSeconds: number
): ParsedTimedLine | null => {
  if (!timedLines || timedLines.length === 0) return null;

  // If before first timestamp, highlight first line if within 1.5 seconds, or none
  if (currentTimeSeconds < (timedLines[0].timeSeconds ?? 0)) {
    if ((timedLines[0].timeSeconds ?? 0) - currentTimeSeconds <= 1.5) {
      return timedLines[0];
    }
    return null;
  }

  // Iterate to find the interval [L_i, L_i+1)
  for (let i = 0; i < timedLines.length; i++) {
    const current = timedLines[i];
    const next = timedLines[i + 1];

    const currentSec = current.timeSeconds ?? 0;
    const nextSec = next ? (next.timeSeconds ?? Infinity) : Infinity;

    if (currentTimeSeconds >= currentSec && currentTimeSeconds < nextSec) {
      return current;
    }
  }

  // If beyond last timestamp, return the last timed line if within reasonable tail (e.g. 8 seconds)
  const lastLine = timedLines[timedLines.length - 1];
  if (currentTimeSeconds >= (lastLine.timeSeconds ?? 0)) {
    return lastLine;
  }

  return null;
};

/**
 * Automatically injects timing indicators into untimed lyrics based on musical pacing
 */
export const autoInjectTimingIndicators = (lyrics: string): string => {
  if (!lyrics || !lyrics.trim()) return lyrics;

  const rawBlocks = lyrics.split(/\n\s*\n/);
  let currentSec = 0;
  const newBlocks: string[] = [];

  rawBlocks.forEach((block) => {
    const lines = block.split('\n');
    const newLines: string[] = [];

    lines.forEach((line) => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // If line already has timestamp, respect it and update currentSec
      const existing = extractTimingIndicator(trimmed);
      if (existing) {
        currentSec = Math.max(currentSec, existing.timeSeconds + 4);
        newLines.push(trimmed);
        return;
      }

      const isMeta = trimmed.startsWith('[') && trimmed.endsWith(']');
      const isParen = trimmed.startsWith('(') && trimmed.endsWith(')');

      const minutes = Math.floor(currentSec / 60);
      const seconds = Math.floor(currentSec % 60);
      const timestamp = `[${minutes}:${seconds.toString().padStart(2, '0')}]`;

      if (isMeta) {
        newLines.push(`${timestamp} ${trimmed}`);
        currentSec += 3;
      } else if (isParen) {
        newLines.push(`${timestamp} ${trimmed}`);
        currentSec += 4;
      } else {
        newLines.push(`${timestamp} ${trimmed}`);
        currentSec += 5;
      }
    });

    if (newLines.length > 0) {
      newBlocks.push(newLines.join('\n'));
    }
  });

  return newBlocks.join('\n\n');
};

/**
 * Removes all timing indicators like [0:05], [00:15.5] from lyrics
 */
export const stripTimingIndicators = (lyrics: string): string => {
  if (!lyrics) return '';
  return lyrics
    .replace(/(?:\[|\()\d{1,2}:\d{2}(?:\.\d{1,3})?(?:\]|\))\s*/g, '')
    .trim();
};

/**
 * Formats seconds into MM:SS display string
 */
export const formatSecondsDisplay = (seconds: number): string => {
  if (isNaN(seconds) || seconds < 0) return '0:00';
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};
