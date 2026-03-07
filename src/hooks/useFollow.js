import { useCallback, useState } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

export function useFollow(accessToken) {
  const [isMutating, setIsMutating] = useState(false);
  const [error, setError] = useState(null);

  const usersBaseUrl = `${API_CONFIG.baseUrl}/users`;

  const extractData = (response) => {
    if (!response) return null;
    return response.data?.data ?? response.data ?? null;
  };

  const extractFollowing = (payload) => {
    if (typeof payload === 'boolean') return payload;
    if (payload && typeof payload === 'object') {
      if (typeof payload.following === 'boolean') return payload.following;
      if (typeof payload.isFollowing === 'boolean') return payload.isFollowing;
    }
    return false;
  };

  const extractCounts = (payload) => {
    if (!payload || typeof payload !== 'object') {
      return { followerCount: 0, followingCount: 0 };
    }
    return {
      followerCount: Number(payload.followerCount || 0),
      followingCount: Number(payload.followingCount || 0),
    };
  };

  const getFollowers = useCallback(async (userId, page = 0, size = 20) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/followers`, {
      params: { page, size },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      withCredentials: true,
    });
    return extractData(response);
  }, [accessToken, usersBaseUrl]);

  const getFollowings = useCallback(async (userId, page = 0, size = 20) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/followings`, {
      params: { page, size },
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      withCredentials: true,
    });
    return extractData(response);
  }, [accessToken, usersBaseUrl]);

  const getFollowCounts = useCallback(async (userId) => {
    const response = await axios.get(`${usersBaseUrl}/${userId}/follow/count`, {
      headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
      withCredentials: true,
    });
    return extractCounts(extractData(response));
  }, [usersBaseUrl, accessToken]);

  const checkFollowing = useCallback(async (userId) => {
    if (!accessToken) return false;

    try {
      const response = await axios.get(`${usersBaseUrl}/${userId}/follow/check`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });
      return extractFollowing(extractData(response));
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
      return extractData(response);
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
      return extractData(response);
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
