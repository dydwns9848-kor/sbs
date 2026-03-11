const STORAGE_KEY = 'viewCountCache';
const cache = new Map();

const getCandidates = (post) => ([
  post?.viewCount,
  post?.views,
  post?.view,
  post?.view_count,
  post?.viewCnt,
  post?.view_cnt,
  post?.viewsCount,
  post?.viewCounts,
  post?.readCount,
  post?.read_count,
  post?.reads,
  post?.hitCount,
  post?.hit_count,
  post?.hits,
  post?.visitCount,
  post?.visit_count,
  post?.stats?.viewCount,
  post?.stats?.views,
  post?.stats?.view,
  post?.statistics?.viewCount,
  post?.statistics?.views,
  post?.statistics?.view,
  post?.meta?.viewCount,
  post?.meta?.views,
  post?.meta?.view,
]);

const resolveViewCount = (post) => {
  if (!post) return null;

  for (const candidate of getCandidates(post)) {
    if (candidate === null || candidate === undefined || candidate === '') {
      continue;
    }

    const numeric = Number(candidate);
    if (Number.isFinite(numeric) && numeric >= 0) {
      return numeric;
    }
  }

  return null;
};

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
  return resolveViewCount(post) ?? 0;
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
  if (!Number.isFinite(numeric) || numeric < 0) {
    return;
  }

  cache.set(postId, numeric);
  persistCache();
}

export function applyCachedViewCount(post) {
  if (!post) return post;
  const cached = cache.get(post.id);
  const server = resolveViewCount(post);
  if (typeof cached !== 'number') {
    return withViewCount(post, server ?? 0);
  }
  if (typeof server !== 'number') {
    return withViewCount(post, cached);
  }
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
