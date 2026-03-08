import { useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';

export function useDm(accessToken) {
  const dmBaseUrl = `${API_CONFIG.baseUrl}/dm`;

  const buildHeaders = () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {});

  const extractData = (response) => {
    if (!response) return null;
    return response.data?.data ?? response.data ?? null;
  };

  const createOrGetRoom = useCallback(async (targetUserId) => {
    const response = await axios.post(
      `${dmBaseUrl}/rooms`,
      { targetUserId },
      {
        headers: buildHeaders(),
        withCredentials: true,
      }
    );
    return extractData(response);
  }, [dmBaseUrl, accessToken]);

  const getMyRooms = useCallback(async (page = 0, size = 20) => {
    const response = await axios.get(`${dmBaseUrl}/rooms`, {
      params: { page, size },
      headers: buildHeaders(),
      withCredentials: true,
    });
    return extractData(response);
  }, [dmBaseUrl, accessToken]);

  const getMessages = useCallback(async (roomId, beforeId, size = 30) => {
    const params = { size };
    if (beforeId) {
      params.beforeId = beforeId;
    }
    const response = await axios.get(`${dmBaseUrl}/rooms/${roomId}/messages`, {
      params,
      headers: buildHeaders(),
      withCredentials: true,
    });
    return extractData(response);
  }, [dmBaseUrl, accessToken]);

  const sendMessage = useCallback(async (roomId, content) => {
    const response = await axios.post(
      `${dmBaseUrl}/rooms/${roomId}/messages`,
      { content },
      {
        headers: buildHeaders(),
        withCredentials: true,
      }
    );
    return extractData(response);
  }, [dmBaseUrl, accessToken]);

  const markAsRead = useCallback(async (roomId, lastReadMessageId) => {
    if (!lastReadMessageId) return null;
    const response = await axios.post(
      `${dmBaseUrl}/rooms/${roomId}/read`,
      { lastReadMessageId },
      {
        headers: buildHeaders(),
        withCredentials: true,
      }
    );
    return extractData(response);
  }, [dmBaseUrl, accessToken]);

  return {
    createOrGetRoom,
    getMyRooms,
    getMessages,
    sendMessage,
    markAsRead,
  };
}

export default useDm;
