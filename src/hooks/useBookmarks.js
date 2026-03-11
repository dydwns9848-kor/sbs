import { useCallback, useMemo, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

function extractData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

export function useBookmarks(accessToken) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const headers = useMemo(() => (
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  ), [accessToken]);

  const bookmark = useCallback(async (postId) => {
    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.post(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/bookmark`,
        {},
        {
          headers,
          withCredentials: true,
        }
      );
      return extractData(response);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [headers]);

  const unbookmark = useCallback(async (postId) => {
    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.delete(
        `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/bookmark`,
        {
          headers,
          withCredentials: true,
        }
      );
      return extractData(response);
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [headers]);

  const checkBookmark = useCallback(async (postId) => {
    const response = await axios.get(
      `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/bookmark/check`,
      {
        headers,
        withCredentials: true,
      }
    );
    return Boolean(extractData(response));
  }, [headers]);

  const getMyBookmarks = useCallback(async (page = 0, size = 20) => {
    const response = await axios.get(
      `${API_CONFIG.baseUrl}/me/bookmarks`,
      {
        params: { page, size },
        headers,
        withCredentials: true,
      }
    );
    return extractData(response);
  }, [headers]);

  return {
    bookmark,
    unbookmark,
    checkBookmark,
    getMyBookmarks,
    isMutating,
    error,
  };
}

export default useBookmarks;
