import { useCallback, useEffect, useState } from 'react';
import axios from 'axios';

import { API_CONFIG } from '../config';

export function useComments(postId, accessToken) {
  const [comments, setComments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [repliesMap, setRepliesMap] = useState({});

  const buildHeaders = useCallback(() => {
    const headers = {};
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return headers;
  }, [accessToken]);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/comments?page=0&size=50`;
      const response = await axios.get(url, {
        headers: buildHeaders(),
        withCredentials: true,
      });

      const data = response.data?.data;
      const list = Array.isArray(data) ? data : data?.content || [];
      setComments(list);
    } catch (err) {
      console.error('댓글 목록 조회 실패:', err);
      setError('댓글을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [postId, buildHeaders]);

  const fetchReplies = useCallback(async (commentId) => {
    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${commentId}/replies`;
      const response = await axios.get(url, {
        headers: buildHeaders(),
        withCredentials: true,
      });
      const data = response.data?.data || response.data || [];
      setRepliesMap(prev => ({ ...prev, [commentId]: data }));
      return data;
    } catch (err) {
      console.error('대댓글 조회 실패:', err);
      return [];
    }
  }, [buildHeaders]);

  const createComment = useCallback(async (content) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/comments`;
    const response = await axios.post(url, { content }, {
      headers: buildHeaders(),
      withCredentials: true,
    });
    const created = response.data?.data;
    if (created) {
      setComments(prev => [created, ...prev]);
    }
    return created;
  }, [postId, buildHeaders]);

  const createReply = useCallback(async (commentId, content) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${commentId}/replies`;
    const response = await axios.post(url, { content }, {
      headers: buildHeaders(),
      withCredentials: true,
    });
    const created = response.data?.data;
    if (created) {
      setRepliesMap(prev => ({
        ...prev,
        [commentId]: [created, ...(prev[commentId] || [])],
      }));
    }
    return created;
  }, [buildHeaders]);

  const updateComment = useCallback(async (commentId, content) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${commentId}`;
    const response = await axios.put(url, { content }, {
      headers: buildHeaders(),
      withCredentials: true,
    });
    const updated = response.data?.data;
    if (updated) {
      setComments(prev => prev.map(comment => comment.id === commentId ? updated : comment));
    }
    return updated;
  }, [buildHeaders]);

  const deleteComment = useCallback(async (commentId) => {
    const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.comments}/${commentId}`;
    await axios.delete(url, {
      headers: buildHeaders(),
      withCredentials: true,
    });
    setComments(prev => prev.filter(comment => comment.id !== commentId));
    setRepliesMap(prev => {
      const copy = { ...prev };
      delete copy[commentId];
      return copy;
    });
  }, [buildHeaders]);

  useEffect(() => {
    fetchComments();
  }, [fetchComments]);

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    createComment,
    createReply,
    updateComment,
    deleteComment,
    fetchReplies,
    repliesMap,
  };
}
