import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import { API_CONFIG } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useHashtags } from '../hooks/useHashtags';
import { formatHashtag, normalizeHashtagName } from '../utils/hashtag';
import './Feed.css';
import './HashtagPosts.css';

const PAGE_SIZE = 10;

function HashtagPosts() {
  const { name } = useParams();
  const normalizedName = useMemo(() => normalizeHashtagName(decodeURIComponent(name || '')), [name]);

  const { isAuthenticated, accessToken } = useAuth();
  const { getHashtag, getPostsByHashtag } = useHashtags(accessToken);

  const [page, setPage] = useState(0);
  const [hashtagInfo, setHashtagInfo] = useState(null);
  const [postsData, setPostsData] = useState({ content: [], totalPages: 0, number: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [likeLoadingIds, setLikeLoadingIds] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!normalizedName) return;

      setIsLoading(true);
      setError(null);
      try {
        const [hashtag, posts] = await Promise.all([
          getHashtag(normalizedName),
          getPostsByHashtag(normalizedName, page, PAGE_SIZE),
        ]);

        setHashtagInfo(hashtag || null);
        setPostsData({
          content: Array.isArray(posts?.content) ? posts.content : [],
          totalPages: Number(posts?.totalPages || 0),
          number: Number(posts?.number || page),
          totalElements: Number(posts?.totalElements || 0),
        });
      } catch (err) {
        setHashtagInfo(null);
        setPostsData({ content: [], totalPages: 0, number: page, totalElements: 0 });
        setError('해시태그 게시글을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [getHashtag, getPostsByHashtag, normalizedName, page]);

  const updatePost = (postId, updater) => {
    setPostsData((prev) => ({
      ...prev,
      content: prev.content.map((post) => (post.id === postId ? updater(post) : post)),
    }));
  };

  const markPostViewed = (postId) => {
    updatePost(postId, (prev) => ({
      ...prev,
      viewCount: Number(prev?.viewCount || 0) + 1,
    }));
  };

  const handleToggleLike = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    const targetPost = postsData.content.find((post) => post.id === postId);
    if (!targetPost) return false;

    const currentlyLiked = Boolean(targetPost?.liked ?? targetPost?.isLiked ?? false);
    const nextLiked = !currentlyLiked;
    const currentCount = Number(targetPost.likeCount || 0);
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    updatePost(postId, (prev) => ({
      ...prev,
      liked: nextLiked,
      isLiked: nextLiked,
      likeCount: optimisticCount,
    }));
    setLikeLoadingIds((prev) => [...prev, postId]);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/like`;
      const method = currentlyLiked ? 'delete' : 'post';
      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const data = response.data?.data;
      updatePost(postId, (prev) => ({
        ...prev,
        liked: data?.liked ?? nextLiked,
        isLiked: data?.liked ?? nextLiked,
        likeCount: data?.likeCount ?? optimisticCount,
      }));
      return true;
    } catch (err) {
      updatePost(postId, (prev) => ({
        ...prev,
        liked: currentlyLiked,
        isLiked: currentlyLiked,
        likeCount: currentCount,
      }));
      alert('좋아요 처리에 실패했습니다.');
      return false;
    } finally {
      setLikeLoadingIds((prev) => prev.filter((id) => id !== postId));
    }
  };

  return (
    <>
      <GNB />
      <main className="hashtag-posts-container">
        <header className="hashtag-posts-header">
          <h1>{formatHashtag(hashtagInfo?.name || normalizedName)}</h1>
          <p>
            게시글 {hashtagInfo?.postCount ?? postsData.totalElements ?? 0}개
          </p>
        </header>

        <section className="feed-content">
          {isLoading ? (
            <p className="feed-state">게시글을 불러오는 중...</p>
          ) : error ? (
            <p className="feed-state">{error}</p>
          ) : postsData.content.length === 0 ? (
            <p className="feed-state">이 해시태그로 등록된 게시글이 없습니다.</p>
          ) : (
            postsData.content.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                onToggleLike={handleToggleLike}
                isLikeLoading={likeLoadingIds.includes(post.id)}
                onViewed={markPostViewed}
              />
            ))
          )}
        </section>

        <div className="feed-pagination">
          <button
            type="button"
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
            disabled={page === 0}
          >
            이전
          </button>
          <span>
            페이지 {page + 1} / {Math.max(1, postsData.totalPages || 1)}
          </span>
          <button
            type="button"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={postsData.totalPages > 0 && page >= postsData.totalPages - 1}
          >
            다음
          </button>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default HashtagPosts;
