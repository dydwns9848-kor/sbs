import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { useBookmarks } from '../hooks/useBookmarks';
import { API_CONFIG } from '../config';
import { applyCachedViewCounts } from '../utils/viewCount';
import './Bookmarks.css';

function normalizeBookmarkPost(item) {
  const source = item?.post ?? item?.postResponse ?? item?.bookmarkedPost ?? item;

  return {
    ...source,
    id: source?.id ?? item?.postId ?? item?.id ?? null,
    userId: source?.userId ?? source?.author?.id ?? item?.userId ?? item?.authorId ?? null,
    userName: source?.userName ?? source?.author?.name ?? item?.userName ?? item?.authorName ?? '알 수 없음',
    userProfileImage: source?.userProfileImage ?? source?.author?.profileImage ?? item?.userProfileImage ?? item?.authorProfileImage ?? null,
    author: source?.author ?? {
      id: source?.userId ?? item?.userId ?? item?.authorId ?? null,
      name: source?.userName ?? item?.userName ?? item?.authorName ?? '알 수 없음',
      profileImage: source?.userProfileImage ?? item?.userProfileImage ?? item?.authorProfileImage ?? null,
    },
    images: Array.isArray(source?.images) ? source.images : [],
    thumbnailUrl:
      source?.thumbnailUrl
      ?? item?.thumbnailUrl
      ?? source?.images?.[0]?.thumbnailUrl
      ?? source?.images?.[0]?.imageUrl
      ?? null,
    bookmarked: true,
    isBookmarked: true,
  };
}

function Bookmarks() {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const { getMyBookmarks } = useBookmarks(accessToken);

  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [pagination, setPagination] = useState({ totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [likeLoadingIds, setLikeLoadingIds] = useState([]);

  const headers = useMemo(
    () => (accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    [accessToken]
  );

  const fetchBookmarks = useCallback(async (nextPage = page) => {
    if (!accessToken) return;

    setIsLoading(true);
    setError(null);

    try {
      const data = await getMyBookmarks(nextPage, 12);
      const list = Array.isArray(data)
        ? data
        : Array.isArray(data?.content)
          ? data.content
          : [];

      const normalized = applyCachedViewCounts(
        list
          .map(normalizeBookmarkPost)
          .filter((post) => post?.id)
      );

      setPosts(normalized);
      setPagination({
        totalPages: Number(data?.totalPages || 0),
        totalElements: Number(data?.totalElements || normalized.length),
      });
      setPage(nextPage);
    } catch (err) {
      console.error('북마크 목록 조회 실패:', err);
      setError('북마크 목록을 불러오지 못했습니다.');
      setPosts([]);
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, getMyBookmarks, page]);

  useEffect(() => {
    if (!authLoading && isAuthenticated && accessToken) {
      fetchBookmarks(0);
    }
  }, [authLoading, isAuthenticated, accessToken, fetchBookmarks]);

  const handleToggleLike = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    const targetPost = posts.find((post) => Number(post.id) === Number(postId));
    if (!targetPost) return false;

    const currentlyLiked = Boolean(targetPost?.liked ?? targetPost?.isLiked ?? false);
    const nextLiked = !currentlyLiked;
    const currentCount = targetPost.likeCount || 0;
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    setPosts((prev) => prev.map((post) => (
      Number(post.id) === Number(postId)
        ? { ...post, liked: nextLiked, isLiked: nextLiked, likeCount: optimisticCount }
        : post
    )));
    setLikeLoadingIds((prev) => [...prev, postId]);

    try {
      const method = currentlyLiked ? 'delete' : 'post';
      const response = await axios({
        method,
        url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/like`,
        headers,
        withCredentials: true,
      });

      const data = response.data?.data;
      const resolvedLiked = Boolean(data?.liked ?? nextLiked);
      const resolvedCount = Number(data?.likeCount ?? optimisticCount);

      setPosts((prev) => prev.map((post) => (
        Number(post.id) === Number(postId)
          ? { ...post, liked: resolvedLiked, isLiked: resolvedLiked, likeCount: resolvedCount }
          : post
      )));
      return true;
    } catch (err) {
      setPosts((prev) => prev.map((post) => (
        Number(post.id) === Number(postId)
          ? { ...post, liked: currentlyLiked, isLiked: currentlyLiked, likeCount: currentCount }
          : post
      )));
      alert('좋아요 처리에 실패했습니다.');
      return false;
    } finally {
      setLikeLoadingIds((prev) => prev.filter((id) => Number(id) !== Number(postId)));
    }
  };

  const handleBookmarkChange = (postId, bookmarked) => {
    if (bookmarked) return;

    setPosts((prev) => prev.filter((post) => Number(post.id) !== Number(postId)));
    setPagination((prev) => ({
      ...prev,
      totalElements: Math.max(0, Number(prev.totalElements || 0) - 1),
    }));
  };

  if (authLoading) {
    return (
      <>
        <GNB />
        <main className="bookmarks-container">
          <div className="bookmarks-state">북마크를 준비하는 중...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <GNB />
        <main className="bookmarks-container">
          <div className="bookmarks-state">
            <p>북마크는 로그인 후 이용할 수 있습니다.</p>
            <Link to="/login" className="bookmarks-login-link">로그인하러 가기</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <GNB />
      <main className="bookmarks-container">
        <div className="bookmarks-header">
          <div>
            <h1>북마크</h1>
            <p>저장해 둔 게시글을 다시 모아보는 공간입니다.</p>
          </div>
          <button type="button" className="bookmarks-refresh-btn" onClick={() => fetchBookmarks(page)}>
            새로고침
          </button>
        </div>

        <div className="bookmarks-list">
          {isLoading ? (
            <div className="bookmarks-state">북마크 목록을 불러오는 중...</div>
          ) : error ? (
            <div className="bookmarks-state">
              <p>{error}</p>
              <button type="button" className="bookmarks-retry-btn" onClick={() => fetchBookmarks(page)}>
                다시 시도
              </button>
            </div>
          ) : posts.length === 0 ? (
            <div className="bookmarks-state">저장한 게시글이 없습니다.</div>
          ) : (
            posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                onToggleLike={handleToggleLike}
                isLikeLoading={likeLoadingIds.includes(post.id)}
                onBookmarkChange={handleBookmarkChange}
              />
            ))
          )}
        </div>

        <div className="bookmarks-pagination">
          <button
            type="button"
            onClick={() => fetchBookmarks(Math.max(0, page - 1))}
            disabled={page === 0 || isLoading}
          >
            이전
          </button>
          <span>{page + 1} / {Math.max(1, pagination.totalPages || 1)}</span>
          <button
            type="button"
            onClick={() => fetchBookmarks(page + 1)}
            disabled={isLoading || pagination.totalPages === 0 || page >= pagination.totalPages - 1}
          >
            다음
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Bookmarks;
