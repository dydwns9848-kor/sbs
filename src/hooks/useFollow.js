import { useCallback, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

export function useFollow(accessToken) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const usersBaseUrl = `${API_CONFIG.baseUrl}/users`;

  const getFollowers = useCallback(async (userId, page = 0, size = 20) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/followers`, {
      params: { page, size },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      withCredentials: true,
    });
    return response.data?.data ?? response.data;
  }, [accessToken, usersBaseUrl]);

  const getFollowings = useCallback(async (userId, page = 0, size = 20) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/followings`, {
      params: { page, size },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      withCredentials: true,
    });
    return response.data?.data ?? response.data;
  }, [accessToken, usersBaseUrl]);

  const getFollowCounts = useCallback(async (userId) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/follow/count`, {
      withCredentials: true,
    });
    return response.data?.data ?? response.data;
  }, [usersBaseUrl]);

  const checkFollowing = useCallback(async (userId) => {
    if (!accessToken) return false;

    try {
      const response = await axios.get(`${usersBaseUrl}/${userId}/follow/check`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const data = response.data?.data ?? response.data;
      return Boolean(data);
    } catch (err) {
      if (err.response?.status === 401) return false;
      throw err;
    }
  }, [accessToken, usersBaseUrl]);

  const follow = useCallback(async (userId) => {
    if (!accessToken) throw new Error('로그인이 필요합니다.');

    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.post(
        `${usersBaseUrl}/${userId}/follow`,
        {},
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        }
      );
      return response.data?.data ?? response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [accessToken, usersBaseUrl]);

  const unfollow = useCallback(async (userId) => {
    if (!accessToken) throw new Error('로그인이 필요합니다.');

    setIsMutating(true);
    setError(null);
    try {
      const response = await axios.delete(`${usersBaseUrl}/${userId}/follow`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      return response.data?.data ?? response.data;
    } catch (err) {
      setError(err);
      throw err;
    } finally {
      setIsMutating(false);
    }
  }, [accessToken, usersBaseUrl]);

  return {
    isMutating,
    error,
    getFollowers,
    getFollowings,
    getFollowCounts,
    checkFollowing,
    follow,
    unfollow,
  };
}

export default useFollow;
