const COMMUNITY_HASHTAG_REGEX = /(^|\s)#([\p{L}\p{N}_-]{1,50})/gu;

export function splitDescriptionForRender(text = '') {
    const source = String(text ?? '');
    if (!source) return [];

    const parts = [];
    let lastIndex = 0;

    for (const match of source.matchAll(COMMUNITY_HASHTAG_REGEX)) {
        const start = match.index ?? 0;
        const prefix = match[1] || '';
        const tag = match[2] || '';
        const tagStart = start + prefix.length;
        const tagEnd = tagStart + tag.length + 1;

        if (start > lastIndex) {
            parts.push({ type: 'text', value: source.slice(lastIndex, start) });
        }

        parts.push({
            type: 'tag',
            value: `#${tag}`,
            norm: tag.toLowerCase(),
        });

        lastIndex = tagEnd;
    }

    if (lastIndex < source.length) {
        parts.push({ type: 'text', value: source.slice(lastIndex) });
    }

    return parts.length ? parts : [{ type: 'text', value: source }];
}

export function extractCommunityHashtags(text = '') {
    return splitDescriptionForRender(text)
        .filter((part) => part.type === 'tag' && part.norm)
        .map((part) => part.norm)
        .filter((tag, index, arr) => arr.indexOf(tag) === index);
}

export function normalizeCommunityHashtag(tag = '') {
    return String(tag).trim().replace(/^#/, '').toLowerCase();
}
