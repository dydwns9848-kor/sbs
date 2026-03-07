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

export function useFeed(accessToken) {
  const [posts, setPosts] = useState([]);
  const [pagination, setPagination] = useState({
    totalElements: 0,
    totalPages: 0,
    page: 0,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchViewCountsForPosts = useCallback(async (postList) => {
    if (!postList || postList.length === 0) return;

    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const requests = postList.map(post => {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${post.id}`;
      return axios.get(url, {
        headers,
        withCredentials: true,
      }).then(res => res.data?.data || res.data)
        .catch(() => null);
    });

    const results = await Promise.allSettled(requests);
    const viewCounts = new Map();

    results.forEach((result) => {
      if (result.status !== 'fulfilled') return;
      const detail = result.value;
      if (!detail || !detail.id) return;
      viewCounts.set(detail.id, getViewCount(detail));
    });

    if (viewCounts.size === 0) return;

    setPosts(prev =>
      prev.map(post => {
        if (!viewCounts.has(post.id)) return post;
        const nextCount = viewCounts.get(post.id);
        rememberViewCount(post.id, nextCount);
        return withViewCount(post, nextCount);
      })
    );
  }, [accessToken]);

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
      setPosts(applyCachedViewCounts(feedPosts));
      fetchViewCountsForPosts(feedPosts);
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
