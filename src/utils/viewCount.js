const STORAGE_KEY = 'viewCountCache';
const cache = new Map();

const loadCache = () => {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return;
    const parsed = JSON.parse(stored);
    Object.entries(parsed).forEach(([key, value]) => {
      const numeric = Number(value);
      if (!Number.isNaN(numeric)) {
        cache.set(Number(key), numeric);
      }
    });
  } catch (err) {
    console.warn('viewCount cache load failed', err);
  }
};

const persistCache = () => {
  try {
    const obj = Object.fromEntries(cache);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(obj));
  } catch (err) {
    console.warn('viewCount cache persist failed', err);
  }
};

// initialize cache on module load
if (typeof window !== 'undefined') {
  loadCache();
}

export function getViewCount(post) {
  if (!post) return 0;
  const candidates = [
    post.viewCount,
    post.views,
    post.view_count,
    post.viewCnt,
    post.view_cnt,
    post.viewsCount,
    post.readCount,
    post.read_count,
    post.hitCount,
    post.hit_count,
    post.stats?.viewCount,
    post.stats?.views,
    post.statistics?.viewCount,
    post.statistics?.views,
    post.meta?.viewCount,
    post.meta?.views,
  ];

  for (const candidate of candidates) {
    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return 0;
}

export function withViewCount(post, count) {
  if (!post) return post;
  const normalizedCount = typeof count === 'number' ? count : getViewCount(post);
  return {
    ...post,
    viewCount: normalizedCount,
    views: normalizedCount,
    view_count: normalizedCount,
  };
}

export function rememberViewCount(postId, count) {
  const numeric = Number(count);
  cache.set(postId, Number.isFinite(numeric) && numeric >= 0 ? numeric : 0);
  persistCache();
}

export function applyCachedViewCount(post) {
  if (!post) return post;
  const cached = cache.get(post.id);
  const server = getViewCount(post);
  if (typeof cached !== 'number') return withViewCount(post, server);
  return withViewCount(post, Math.max(server, cached));
}

export function applyCachedViewCounts(posts = []) {
  return posts.map(post => applyCachedViewCount(post));
}

export function resetViewCountCache() {
  cache.clear();
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(STORAGE_KEY);
  }
}
