import { useMemo } from 'react';
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

  const get = async (endpoint, params = {}) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.get(url, {
      params: compactQuery(params),
      headers,
      withCredentials: true,
    });
    return getData(response);
  };

  const patch = async (endpoint, body = {}) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.patch(url, body, {
      headers,
      withCredentials: true,
    });
    return getData(response);
  };

  const del = async (endpoint, body = null) => {
    const url = `${API_CONFIG.baseUrl}${endpoint}`;
    const response = await axios.delete(url, {
      headers,
      withCredentials: true,
      data: body || undefined,
    });
    return getData(response);
  };

  return {
    getDashboardSummary: () => get(API_CONFIG.endpoints.admin.dashboardSummary),

    getUsers: async (params = {}) => normalizePageData(
      await get(API_CONFIG.endpoints.admin.users, params)
    ),
    getUserDetail: (userId) => get(API_CONFIG.endpoints.admin.userDetail(userId)),
    updateUserStatus: (userId, payload) => patch(API_CONFIG.endpoints.admin.userStatus(userId), payload),
    updateUserRole: (userId, payload) => patch(API_CONFIG.endpoints.admin.userRole(userId), payload),

    getPosts: async (params = {}) => normalizePageData(
      await get(API_CONFIG.endpoints.admin.posts, params)
    ),
    getPostDetail: (postId) => get(API_CONFIG.endpoints.admin.postDetail(postId)),
    deletePost: (postId, payload) => del(API_CONFIG.endpoints.admin.postDetail(postId), payload),

    getComments: async (params = {}) => normalizePageData(
      await get(API_CONFIG.endpoints.admin.comments, params)
    ),
    getCommentDetail: (commentId) => get(API_CONFIG.endpoints.admin.commentDetail(commentId)),
    deleteComment: (commentId, payload) => del(API_CONFIG.endpoints.admin.commentDetail(commentId), payload),

    getAuditLogs: async (params = {}) => normalizePageData(
      await get(API_CONFIG.endpoints.admin.auditLogs, params)
    ),
  };
}
