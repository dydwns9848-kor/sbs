const cache = new Map();

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
}
