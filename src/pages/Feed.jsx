import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { API_CONFIG } from '../config';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import PostCard from '../components/PostCard';
import { useAuth } from '../hooks/useAuth';
import { useFeed } from '../hooks/useFeed';
import './Feed.css';

const FEED_TABS = [
  { key: 'home', label: '홈 피드', description: '팔로잉한 사용자의 최신 게시글', requiresAuth: true },
  { key: 'explore', label: '탐색', description: '전체 공개 게시글 최신순' },
  { key: 'popular', label: '인기', description: '좋아요가 많은 게시글' },
  { key: 'views', label: '조회수', description: '조회수가 높은 게시글' },
  { key: 'recommended', label: '추천', description: '내게 맞춤 추천 게시글', requiresAuth: true },
];
const PAGE_SIZE = 10;

function Feed() {
  const { isAuthenticated, isLoading: authLoading, accessToken } = useAuth();
  const {
    posts,
    pagination,
    isLoading,
    error,
    fetchFeed,
    updatePost,
    resetFeed,
  } = useFeed(accessToken);

  const [activeTab, setActiveTab] = useState('home');
  const [includeMyPosts, setIncludeMyPosts] = useState(false);
  const [page, setPage] = useState(0);
  const [feedError, setFeedError] = useState(null);
  const [likeLoadingIds, setLikeLoadingIds] = useState([]);

  const activeTabConfig = useMemo(() => FEED_TABS.find(tab => tab.key === activeTab), [activeTab]);
  const requiresAuth = activeTabConfig?.requiresAuth;

  const fetchParams = useMemo(() => ({
    feedType: activeTab,
    page,
    size: PAGE_SIZE,
    includeMyPosts: activeTab === 'home' ? includeMyPosts : false,
  }), [activeTab, page, includeMyPosts]);

  useEffect(() => {
    if (requiresAuth) {
      if (authLoading) {
        return;
      }
      if (!isAuthenticated) {
        setFeedError('로그인이 필요한 피드입니다. 로그인을 먼저 해주세요.');
        resetFeed();
        return;
      }
    }

    setFeedError(null);
    fetchFeed(fetchParams);
  }, [
    fetchFeed,
    isAuthenticated,
    authLoading,
    requiresAuth,
    resetFeed,
    fetchParams,
  ]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    setPage(0);
  };

  const handleIncludeMyPostsChange = () => {
    setIncludeMyPosts(prev => !prev);
    setPage(0);
  };

  const handlePrevPage = () => {
    setPage(prev => Math.max(0, prev - 1));
  };

  const handleNextPage = () => {
    setPage(prev => Math.min(prev + 1, pagination.totalPages - 1));
  };

  const handleToggleLike = async (postId) => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return false;
    }

    const targetPost = posts.find(post => post.id === postId);
    if (!targetPost) return false;

    const currentlyLiked = Boolean(targetPost?.liked ?? targetPost?.isLiked);
    const nextLiked = !currentlyLiked;
    const currentCount = targetPost.likeCount || 0;
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    updatePost(postId, prev => ({
      ...prev,
      liked: nextLiked,
      isLiked: nextLiked,
      likeCount: optimisticCount,
    }));
    setLikeLoadingIds(prev => [...prev, postId]);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${postId}/like`;
      const method = currentlyLiked ? 'delete' : 'post';
      const response = await axios({
        method,
        url,
        headers: { 'Authorization': `Bearer ${accessToken}` },
        withCredentials: true,
      });
      const serverData = response.data?.data;
      const serverLiked = serverData?.liked ?? nextLiked;
      const serverLikeCount = serverData?.likeCount ?? optimisticCount;

      updatePost(postId, prev => ({
        ...prev,
        liked: serverLiked,
        isLiked: serverLiked,
        likeCount: serverLikeCount,
      }));
      return true;
    } catch (err) {
      console.error('피드 좋아요 실패:', err);
      updatePost(postId, prev => ({
        ...prev,
        liked: currentlyLiked,
        isLiked: currentlyLiked,
        likeCount: currentCount,
      }));
      alert('좋아요 처리에 실패했습니다.');
      return false;
    } finally {
      setLikeLoadingIds(prev => prev.filter(id => id !== postId));
    }
  };

  const shouldShowLoginHint = Boolean(requiresAuth && !isAuthenticated && !authLoading);

  return (
    <>
      <GNB />
      <div className="feed-container">
        <header className="feed-header">
          <div>
            <h1>피드</h1>
            <p className="feed-description">
              {activeTabConfig?.description || '다양한 게시글을 탐색하세요.'}
            </p>
          </div>
          {activeTab === 'home' && (
            <label className="feed-include-toggle">
              <input
                type="checkbox"
                checked={includeMyPosts}
                onChange={handleIncludeMyPostsChange}
              />
              내 게시글 포함
            </label>
          )}
        </header>

        <div className="feed-tabs">
          {FEED_TABS.map(tab => (
            <button
              key={tab.key}
              className={`feed-tab ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => handleTabChange(tab.key)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {shouldShowLoginHint && (
          <div className="feed-hint">
            <p>이 피드는 로그인된 사용자만 이용할 수 있습니다.</p>
            <Link to="/login" className="feed-hint-link">
              로그인하러 가기
            </Link>
          </div>
        )}

        <div className="feed-content">
          {isLoading ? (
            <p className="feed-state">피드를 불러오는 중...</p>
          ) : feedError || error ? (
            <p className="feed-state">
              {feedError || error}
              {!shouldShowLoginHint && (
                <button onClick={() => fetchFeed(fetchParams)}>
                  다시 시도
                </button>
              )}
            </p>
          ) : posts.length === 0 ? (
            <p className="feed-state">아직 게시글이 없습니다.</p>
          ) : (
            posts.map(post => (
              <PostCard
                key={post.id}
                post={post}
                isAuthenticated={isAuthenticated}
                onToggleLike={handleToggleLike}
                isLikeLoading={likeLoadingIds.includes(post.id)}
              />
            ))
          )}
        </div>

        <div className="feed-pagination">
          <button onClick={handlePrevPage} disabled={page === 0}>
            이전
          </button>
          <span>
            페이지 {pagination.page + 1} / {Math.max(1, pagination.totalPages || 1)}
          </span>
          <button
            onClick={handleNextPage}
            disabled={pagination.totalPages === 0 || page >= pagination.totalPages - 1}
          >
            다음
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Feed;
