export function normalizeHashtagName(value) {
  if (value === null || value === undefined) return '';
  const raw = String(value).trim();
  if (!raw) return '';
  return raw.replace(/^#+/, '').trim();
}

export function formatHashtag(name) {
  const normalized = normalizeHashtagName(name);
  return normalized ? `#${normalized}` : '';
}

function extractFromTagObject(tag) {
  if (!tag || typeof tag !== 'object') return '';
  return normalizeHashtagName(
    tag.name ?? tag.hashtag ?? tag.tag ?? tag.keyword ?? ''
  );
}

function extractFromContent(content) {
  if (!content || typeof content !== 'string') return [];
  const matches = content.match(/#([0-9A-Za-z_가-힣]+)/g) || [];
  return matches.map((token) => normalizeHashtagName(token));
}

export function extractHashtagNames(post) {
  if (!post || typeof post !== 'object') return [];

  const candidates = [];
  const rawSources = [
    post.hashtags,
    post.hashTags,
    post.tags,
    post.tagNames,
  ];

  rawSources.forEach((source) => {
    if (Array.isArray(source)) {
      source.forEach((entry) => {
        if (typeof entry === 'string') {
          candidates.push(normalizeHashtagName(entry));
        } else {
          candidates.push(extractFromTagObject(entry));
        }
      });
      return;
    }

    if (typeof source === 'string') {
      source
        .split(/[,\s]+/)
        .map(normalizeHashtagName)
        .forEach((name) => candidates.push(name));
    }
  });

  extractFromContent(post.content).forEach((name) => candidates.push(name));

  return Array.from(new Set(candidates.filter(Boolean)));
}
