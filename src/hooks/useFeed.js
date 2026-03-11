import { useCallback, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';
import {
  getViewCount,
  withViewCount,
  rememberViewCount,
  applyCachedViewCounts,
} from '../utils/viewCount';

const DEFAULT_PAGE_SIZE = 10;

async function enrichPostsWithViewCounts(posts, accessToken) {
  const targets = posts.filter((post) => getViewCount(post) === 0 && post?.id);
  if (targets.length === 0) {
    return posts;
  }

  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

  const results = await Promise.allSettled(
    targets.map((post) =>
      axios.get(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${post.id}`, {
        headers,
        withCredentials: true,
      })
    )
  );

  const countMap = new Map();

  results.forEach((result, index) => {
    if (result.status !== 'fulfilled') {
      return;
    }

    const source = result.value.data?.data ?? result.value.data;
    const nextCount = getViewCount(source);
    if (Number.isFinite(nextCount) && nextCount > 0) {
      countMap.set(targets[index].id, nextCount);
      rememberViewCount(targets[index].id, nextCount);
    }
  });

  if (countMap.size === 0) {
    return posts;
  }

  return posts.map((post) => {
    const nextCount = countMap.get(post.id);
    return typeof nextCount === 'number' ? withViewCount(post, nextCount) : post;
  });
}

export function useFeed(accessToken) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    page: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchFeed = useCallback(async ({ feedType, page = 0, size = DEFAULT_PAGE_SIZE, includeMyPosts = false }) => {
    setIsLoading(true);
    setError(null);

    try {
      const feedEndpoints = API_CONFIG.endpoints.feed;
      const endpoint = feedEndpoints?.[feedType];
      if (!endpoint) {
        throw new Error('유효하지 않은 피드 유형입니다.');
      }

      const params = new URLSearchParams({
        page: page.toString(),
        size: Math.min(size, 50).toString(),
      });
      if (feedType === 'home' && includeMyPosts) {
        params.set('includeMyPosts', 'true');
      }

      const url = `${API_CONFIG.baseUrl}${endpoint}?${params.toString()}`;
      const headers = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await axios.get(url, {
        headers,
        withCredentials: true,
      });

      const data = response.data?.data;
      const feedPosts = Array.isArray(data?.content) ? data.content : [];
      const normalizedPosts = applyCachedViewCounts(feedPosts);
      setPosts(normalizedPosts);

      const enrichedPosts = await enrichPostsWithViewCounts(normalizedPosts, accessToken);
      setPosts(enrichedPosts);
      setPagination({
        totalElements: data?.totalElements || 0,
        totalPages: data?.totalPages || 0,
        page,
      });
      return feedPosts;
    } catch (fetchError) {
      console.error('피드 조회 실패:', fetchError);
      setPosts([]);
      setPagination({ totalElements: 0, totalPages: 0, page: 0 });
      setError('피드를 불러오지 못했습니다. 다시 시도해 주세요.');
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [accessToken]);

  const updatePost = useCallback((postId, updater) => {
    setPosts(prev =>
      prev.map(post => (post.id === postId ? updater(post) : post))
    );
  }, []);

  const markPostViewed = useCallback((postId) => {
    updatePost(postId, prev => {
      if (!prev) return prev;
      const nextCount = getViewCount(prev) + 1;
      rememberViewCount(postId, nextCount);
      return withViewCount(prev, nextCount);
    });
  }, [updatePost]);

  const resetFeed = useCallback(() => {
    setPosts([]);
    setPagination({ totalElements: 0, totalPages: 0, page: 0 });
    setError(null);
  }, []);

  return {
    posts,
    pagination,
    isLoading,
    error,
    fetchFeed,
    updatePost,
    resetFeed,
    markPostViewed,
  };
}
