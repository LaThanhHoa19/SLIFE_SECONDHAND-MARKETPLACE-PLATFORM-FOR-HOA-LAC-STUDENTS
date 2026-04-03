import { Box } from '@mui/material';

/** Giống backend ChatService.foldSearchText — bỏ dấu, lowercase. */
export function foldSearchText(s) {
  if (s == null || s === '') return '';
  return String(s)
      .normalize('NFD')
      .replace(/\p{M}/gu, '')
      .toLowerCase();
}

/**
 * Mảng vị trí [origStart, origEnd) trong chuỗi gốc, theo khớp trên chuỗi đã fold.
 * Trả về các khoảng đã gộp (không chồng).
 */
function foldedMatchRangesToOrig(text, qFolded) {
  if (!qFolded || !text) return [];
  const fullFold = foldSearchText(text);
  if (fullFold.length === 0) return [];

  const cum = [0];
  for (const ch of text) {
    cum.push(cum[cum.length - 1] + foldSearchText(ch).length);
  }
  if (cum[cum.length - 1] !== fullFold.length) {
    return [];
  }

  const qLen = qFolded.length;
  const intervals = [];
  let from = 0;
  while (from <= fullFold.length - qLen) {
    const idx = fullFold.indexOf(qFolded, from);
    if (idx < 0) break;

    let oStart = 0;
    for (let i = 0; i < cum.length - 1; i += 1) {
      if (cum[i + 1] > idx) {
        oStart = i;
        break;
      }
    }
    const fEnd = idx + qLen;
    let oEnd = text.length;
    for (let i = 0; i < cum.length; i += 1) {
      if (cum[i] >= fEnd) {
        oEnd = i;
        break;
      }
    }
    intervals.push([oStart, oEnd]);
    from = idx + 1;
  }

  if (intervals.length === 0) return [];

  intervals.sort((a, b) => a[0] - b[0]);
  const merged = [intervals[0]];
  for (let k = 1; k < intervals.length; k += 1) {
    const prev = merged[merged.length - 1];
    const cur = intervals[k];
    if (cur[0] <= prev[1]) {
      prev[1] = Math.max(prev[1], cur[1]);
    } else {
      merged.push(cur);
    }
  }
  return merged;
}

/**
 * @param {string} text
 * @param {string} query — từ khóa ô search (chưa debounce cũng được; nên dùng cùng chuỗi BE đang lọc)
 */
export function splitHighlightParts(text, query) {
  const raw = text == null ? '' : String(text);
  const qFolded = foldSearchText((query || '').trim());
  if (!qFolded) {
    return [{ text: raw, highlight: false }];
  }
  const ranges = foldedMatchRangesToOrig(raw, qFolded);
  if (ranges.length === 0) {
    return [{ text: raw, highlight: false }];
  }
  const parts = [];
  let cursor = 0;
  for (const [start, end] of ranges) {
    if (start > cursor) {
      parts.push({ text: raw.slice(cursor, start), highlight: false });
    }
    if (end > start) {
      parts.push({ text: raw.slice(start, end), highlight: true });
    }
    cursor = Math.max(cursor, end);
  }
  if (cursor < raw.length) {
    parts.push({ text: raw.slice(cursor), highlight: false });
  }
  return parts.length > 0 ? parts : [{ text: raw, highlight: false }];
}

const markSx = {
  bgcolor: 'rgba(255, 235, 59, 0.72)',
  color: 'inherit',
  borderRadius: '3px',
  padding: '0 2px',
  boxDecorationBreak: 'clone',
  WebkitBoxDecorationBreak: 'clone',
};

/**
 * Hiển thị text với các đoạn khớp tìm kiếm được tô vàng (mark).
 */
export function SearchHighlight({ text, query, component = 'span', sx = {} }) {
  const parts = splitHighlightParts(text, query);
  return (
    <Box component={component} sx={{ ...sx, minWidth: 0 }}>
      {parts.map((p, i) =>
          p.highlight ? (
            <Box key={i} component="mark" sx={markSx}>
              {p.text}
            </Box>
          ) : (
            <span key={i}>{p.text}</span>
          ),
      )}
    </Box>
  );
}
