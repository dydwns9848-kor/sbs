import { useCallback, useMemo } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';
import { normalizePageData } from '../utils/admin';

function getData(response) {
  return response?.data?.data ?? response?.data ?? null;
}

function compactQuery(params = {}) {
  return Object.fromEntries(
    Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== '')
  );
}

export function useAdmin(accessToken) {
  const headers = useMemo(() => (
    accessToken ? { Authorization: `Bearer ${accessToken}` } : {}
  ), [accessToken]);

  const get = useCallback(async (endpoint, params = {}) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.get(url, {
      params: compactQuery(params),
      headers,
      withCredentials: true,
    });
    return getData(response);
  }, [headers]);

  const patch = useCallback(async (endpoint, body = {}) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.patch(url, body, {
      headers,
      withCredentials: true,
    });
    return getData(response);
  }, [headers]);

  const del = useCallback(async (endpoint, body = null) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.delete(url, {
      headers,
      withCredentials: true,
      data: body || undefined,
    });
    return getData(response);
  }, [headers]);

  const getDashboardSummary = useCallback(
    () => get(API_CONFIG.endpoints.admin.dashboardSummary),
    [get]
  );

  const getUsers = useCallback(async (params = {}) => normalizePageData(
    await get(API_CONFIG.endpoints.admin.users, params)
  ), [get]);
  const getUserDetail = useCallback((userId) => get(API_CONFIG.endpoints.admin.userDetail(userId)), [get]);
  const updateUserStatus = useCallback((userId, payload) => patch(API_CONFIG.endpoints.admin.userStatus(userId), payload), [patch]);
  const updateUserRole = useCallback((userId, payload) => patch(API_CONFIG.endpoints.admin.userRole(userId), payload), [patch]);

  const getPosts = useCallback(async (params = {}) => normalizePageData(
    await get(API_CONFIG.endpoints.admin.posts, params)
  ), [get]);
  const getPostDetail = useCallback((postId) => get(API_CONFIG.endpoints.admin.postDetail(postId)), [get]);
  const deletePost = useCallback((postId, payload) => del(API_CONFIG.endpoints.admin.postDetail(postId), payload), [del]);

  const getComments = useCallback(async (params = {}) => normalizePageData(
    await get(API_CONFIG.endpoints.admin.comments, params)
  ), [get]);
  const getCommentDetail = useCallback((commentId) => get(API_CONFIG.endpoints.admin.commentDetail(commentId)), [get]);
  const deleteComment = useCallback((commentId, payload) => del(API_CONFIG.endpoints.admin.commentDetail(commentId), payload), [del]);

  const getAuditLogs = useCallback(async (params = {}) => normalizePageData(
    await get(API_CONFIG.endpoints.admin.auditLogs, params)
  ), [get]);

  return useMemo(() => ({
    getDashboardSummary,
    getUsers,
    getUserDetail,
    updateUserStatus,
    updateUserRole,
    getPosts,
    getPostDetail,
    deletePost,
    getComments,
    getCommentDetail,
    deleteComment,
    getAuditLogs,
  }), [
    getDashboardSummary,
    getUsers,
    getUserDetail,
    updateUserStatus,
    updateUserRole,
    getPosts,
    getPostDetail,
    deletePost,
    getComments,
    getCommentDetail,
    deleteComment,
    getAuditLogs,
  ]);
}
