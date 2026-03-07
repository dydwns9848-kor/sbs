export function getViewCount(post) {
  if (!post) return 0;
  return post.viewCount ?? post.views ?? post.view_count ?? 0;
}

export function withViewCount(post, count) {
  if (!post) return post;
  return {
    ...post,
    viewCount: count,
    views: count,
    view_count: count,
  };
}
