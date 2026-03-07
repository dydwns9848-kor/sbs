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
  return post.viewCount ?? post.views ?? post.view_count ?? 0;
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
  cache.set(postId, count);
  persistCache();
}

export function applyCachedViewCount(post) {
  if (!post) return post;
  const cached = cache.get(post.id);
  if (typeof cached !== 'number') return post;
  return withViewCount(post, cached);
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
