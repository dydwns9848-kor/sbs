import { useCallback, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

function resolveApiData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export function useHashtags(accessToken) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const withAuthHeaders = useCallback(() => {
    if (!accessToken) return {};
    return { Authorization: `Bearer ${accessToken}` };
  }, [accessToken]);

  const request = useCallback(async (url, params = {}) => {
    const response = await axios.get(url, {
      params,
      headers: withAuthHeaders(),
      withCredentials: true,
    });
    return resolveApiData(response);
  }, [withAuthHeaders]);

  const runRequest = useCallback(async (callback) => {
    setIsLoading(true);
    setError(null);
    try {
      return await callback();
    } catch (err) {
      console.error('해시태그 API 요청 실패:', err);
      setError('해시태그 데이터를 불러오지 못했습니다.');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getTrendingHashtags = useCallback((page = 0, size = 10) => runRequest(() => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.hashtags.trending}`;
    return request(url, { page, size: Math.min(size, 50) });
  }), [request, runRequest]);

  const getTopTrendingHashtags = useCallback((limit = 10) => runRequest(() => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.hashtags.topTrending}`;
    return request(url, { limit: Math.min(limit, 50) });
  }), [request, runRequest]);

  const searchHashtags = useCallback((keyword, page = 0, size = 10) => runRequest(() => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.hashtags.search}`;
    return request(url, { keyword, page, size: Math.min(size, 50) });
  }), [request, runRequest]);

  const getHashtag = useCallback((name) => runRequest(() => {
    const endpoint = API_CONFIG.endpoints.hashtags.byName(name);
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return request(url);
  }), [request, runRequest]);

  const getPostsByHashtag = useCallback((name, page = 0, size = 10) => runRequest(() => {
    const endpoint = API_CONFIG.endpoints.hashtags.postsByName(name);
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    return request(url, { page, size: Math.min(size, 50) });
  }), [request, runRequest]);

  return {
    isLoading,
    error,
    getTrendingHashtags,
    getTopTrendingHashtags,
    searchHashtags,
    getHashtag,
    getPostsByHashtag,
  };
}
