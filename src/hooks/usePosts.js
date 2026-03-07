import { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../config';
import {
  getViewCount,
  withViewCount,
  rememberViewCount,
  applyCachedViewCounts,
} from '../utils/viewCount';

/**
 * usePosts 커스텀 훅
 *
 * 게시글 목록 조회 및 삭제 기능을 관리합니다.
 *
 * @param {string} accessToken - JWT 액세스 토큰
 * @param {Object} options - 옵션
 * @param {boolean} options.myPostsOnly - true이면 내 게시글만 조회
 * @returns {Object} 게시글 목록 관련 상태 및 함수
 */
export function usePosts(accessToken, { myPostsOnly = false } = {}) {
  // ==========================================
  // 상태 정의
  // ==========================================
  const [posts, setPosts] = useState([]);           // 게시글 목록
  const [isLoading, setIsLoading] = useState(true); // 로딩 상태
  const [error, setError] = useState(null);         // 에러 상태
  const [likeLoadingIds, setLikeLoadingIds] = useState([]); // 좋아요 처리 중인 게시글 ID 목록

  const fetchViewCountsForPosts = useCallback(async (postList) => {
    if (!postList || postList.length === 0) {
      return;
    }

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

    results.forEach(result => {
      if (result.status !== 'fulfilled') return;
      const detail = result.value;
      if (!detail || !detail.id) return;
      viewCounts.set(detail.id, getViewCount(detail));
    });

    if (viewCounts.size === 0) {
      return;
    }

    setPosts(prev =>
      prev.map(post => {
        if (!viewCounts.has(post.id)) return post;
        const nextCount = viewCounts.get(post.id);
        rememberViewCount(post.id, nextCount);
        return withViewCount(post, nextCount);
      })
    );
  }, [accessToken]);

  // ==========================================
  // 게시글 목록 조회
  // ==========================================

  /**
   * 게시글 목록을 서버에서 가져옵니다.
   * myPostsOnly 옵션에 따라 전체 피드 또는 내 게시글만 조회합니다.
   */
  const fetchPosts = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // myPostsOnly에 따라 API 엔드포인트 결정
      const endpoint = myPostsOnly
        ? API_CONFIG.endpoints.myPosts
        : API_CONFIG.endpoints.posts;

      const url = `${API_CONFIG.baseUrl}${endpoint}`;

      // 헤더 구성 (인증 토큰이 있으면 포함)
      const headers = {};
      if (accessToken) {
        headers['Authorization'] = `Bearer ${accessToken}`;
      }

      const response = await axios.get(url, {
        headers,
        withCredentials: true
      });

      console.log('게시글 목록 조회 응답:', response.data);

      // 응답 데이터에서 게시글 배열 추출
      if (response.data?.data) {
        // 배열인 경우 바로 사용, 페이지네이션 객체인 경우 content 추출
        const postData = Array.isArray(response.data.data)
          ? response.data.data
          : response.data.data.content || [];
        setPosts(applyCachedViewCounts(postData));
        fetchViewCountsForPosts(postData);
      } else {
        setPosts([]);
      }
    } catch (err) {
      console.error('게시글 목록 조회 실패:', err);
      setError('게시글을 불러오는데 실패했습니다.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, myPostsOnly]);

  // 컴포넌트 마운트 시 게시글 조회
  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // ==========================================
  // 게시글 삭제
  // ==========================================

  /**
   * 게시글을 삭제합니다. (Soft Delete)
   * @param {number} postId - 삭제할 게시글 ID
   * @returns {Promise<boolean>} 삭제 성공 여부
   */
  const deletePost = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}`;
      await axios.delete(url, {
        headers: { 'Authorization': `Bearer ${accessToken}` },
        withCredentials: true
      });

      // 목록에서 삭제된 게시글 제거
      setPosts(prev => prev.filter(post => post.id !== postId));
      return true;
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
      return false;
    }
  };

  // ==========================================
  // 게시글 좋아요 / 좋아요 취소
  // ==========================================

  const isPostLiked = (post) => {
    return Boolean(post?.liked ?? post?.isLiked ?? false);
  };

  const setPostLikeState = (postId, liked, likeCount) => {
    setPosts(prev => prev.map(post => {
      if (post.id !== postId) return post;
      return {
        ...post,
        liked,
        isLiked: liked,
        likeCount: likeCount ?? post.likeCount ?? 0
      };
    }));
  };

  const togglePostLike = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    const targetPost = posts.find(post => post.id === postId);
    if (!targetPost) return false;

    const currentlyLiked = isPostLiked(targetPost);
    const nextLiked = !currentlyLiked;
    const currentCount = targetPost.likeCount || 0;
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    // 낙관적 업데이트
    setPostLikeState(postId, nextLiked, optimisticCount);
    setLikeLoadingIds(prev => [...prev, postId]);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/like`;
      const method = currentlyLiked ? 'delete' : 'post';
      const response = await axios({
        method,
        url,
        headers: { 'Authorization': `Bearer ${accessToken}` },
        withCredentials: true
      });

      const data = response.data?.data;
      const serverLiked = data?.liked ?? nextLiked;
      const serverLikeCount = data?.likeCount ?? optimisticCount;
      setPostLikeState(postId, serverLiked, serverLikeCount);
      return true;
    } catch (err) {
      console.error('게시글 좋아요 처리 실패:', err);
      // 실패 시 원복
      setPostLikeState(postId, currentlyLiked, currentCount);
      alert('좋아요 처리에 실패했습니다.');
      return false;
    } finally {
      setLikeLoadingIds(prev => prev.filter(id => id !== postId));
    }
  };

  const markPostViewed = (postId) => {
    setPosts(prev =>
      prev.map(post => {
        if (post.id !== postId) return post;
        const nextCount = getViewCount(post) + 1;
        rememberViewCount(postId, nextCount);
        return withViewCount(post, nextCount);
      })
    );
  };

  // ==========================================
  // 반환값
  // ==========================================
  return {
    posts,
    isLoading,
    error,
    fetchPosts,  // 목록 새로고침
    deletePost,
    togglePostLike,
    likeLoadingIds,
    markPostViewed,
  };
}
