import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useFollow } from '../hooks/useFollow';
import { API_CONFIG } from '../config';
import { getViewCount, rememberViewCount } from '../utils/viewCount';
import './PostDetail.css';
import CommentSection from '../components/CommentSection';

function PostDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, accessToken, isAuthenticated } = useAuth();
  const {
    getFollowCounts,
    checkFollowing,
    follow,
    unfollow,
    isMutating: isFollowMutating,
  } = useFollow(accessToken);

  const [post, setPost] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isLikeLoading, setIsLikeLoading] = useState(false);

  const [followCounts, setFollowCounts] = useState({ followerCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowLoading, setIsFollowLoading] = useState(false);

  const handleCommentCountChange = (delta) => {
    setPost((prev) => (
      prev
        ? {
            ...prev,
            commentCount: Math.max(0, (prev.commentCount || 0) + delta),
          }
        : prev
    ));
  };

  const fetchPost = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}`;
      const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};

      const response = await axios.get(url, {
        headers,
        withCredentials: true,
      });

      const responsePost = response.data?.data || response.data;
      setPost(responsePost);
      if (responsePost) {
        rememberViewCount(responsePost.id, getViewCount(responsePost));
      }
    } catch (err) {
      if (err.response?.status === 404) {
        setError('게시글을 찾을 수 없습니다.');
      } else {
        setError('게시글을 불러오지 못했습니다.');
      }
    } finally {
      setIsLoading(false);
    }
  }, [id, accessToken]);

  useEffect(() => {
    fetchPost();
  }, [fetchPost]);

  const isPostLiked = Boolean(post?.liked ?? post?.isLiked ?? false);
  const authorName = post?.author?.name || post?.userName || '알 수 없음';
  const authorImage = post?.author?.profileImage || post?.userProfileImage || null;
  const authorId = post?.author?.id || post?.userId || null;

  const isOwner = Boolean(
    user &&
    post &&
    (
      user.id === post.userId ||
      user.id === post.author?.id ||
      user.email === post.author?.email
    )
  );

  useEffect(() => {
    if (!authorId) return;

    let cancelled = false;

    const fetchFollowMeta = async () => {
      setIsFollowLoading(true);
      try {
        const counts = await getFollowCounts(authorId);
        if (!cancelled && counts) {
          setFollowCounts({
            followerCount: counts.followerCount || 0,
            followingCount: counts.followingCount || 0,
          });
        }

        if (isAuthenticated && !isOwner) {
          const following = await checkFollowing(authorId);
          if (!cancelled) {
            setIsFollowing(Boolean(following));
          }
        } else if (!cancelled) {
          setIsFollowing(false);
        }
      } catch (err) {
        console.error('팔로우 정보 조회 실패:', err);
      } finally {
        if (!cancelled) {
          setIsFollowLoading(false);
        }
      }
    };

    fetchFollowMeta();

    return () => {
      cancelled = true;
    };
  }, [authorId, getFollowCounts, checkFollowing, isAuthenticated, isOwner]);

  const handleDelete = async () => {
    if (!window.confirm('게시글을 삭제하시겠습니까?')) return;

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}`;
      await axios.delete(url, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      alert('게시글이 삭제되었습니다.');
      navigate('/posts');
    } catch (err) {
      console.error('게시글 삭제 실패:', err);
      alert('게시글 삭제에 실패했습니다.');
    }
  };

  const handleToggleLike = async () => {
    if (!accessToken) {
      alert('로그인이 필요합니다.');
      return;
    }
    if (!post || isLikeLoading) return;

    const currentLiked = isPostLiked;
    const nextLiked = !currentLiked;
    const currentCount = post.likeCount || 0;
    const optimisticCount = Math.max(0, currentCount + (nextLiked ? 1 : -1));

    setPost((prev) => (prev
      ? {
          ...prev,
          liked: nextLiked,
          isLiked: nextLiked,
          likeCount: optimisticCount,
        }
      : prev));
    setIsLikeLoading(true);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}/${id}/like`;
      const method = currentLiked ? 'delete' : 'post';
      const response = await axios({
        method,
        url,
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      const data = response.data?.data;
      const serverLiked = data?.liked ?? nextLiked;
      const serverLikeCount = data?.likeCount ?? optimisticCount;

      setPost((prev) => (prev
        ? {
            ...prev,
            liked: serverLiked,
            isLiked: serverLiked,
            likeCount: serverLikeCount,
          }
        : prev));
    } catch (err) {
      console.error('좋아요 처리 실패:', err);
      setPost((prev) => (prev
        ? {
            ...prev,
            liked: currentLiked,
            isLiked: currentLiked,
            likeCount: currentCount,
          }
        : prev));
      alert('좋아요 처리에 실패했습니다.');
    } finally {
      setIsLikeLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (!authorId || isOwner || isFollowMutating) return;

    if (!isAuthenticated || !accessToken) {
      alert('로그인 후 팔로우할 수 있습니다.');
      navigate('/login');
      return;
    }

    const previousFollowing = isFollowing;
    const previousFollowerCount = followCounts.followerCount || 0;
    const optimisticFollowing = !previousFollowing;

    setIsFollowing(optimisticFollowing);
    setFollowCounts((prev) => ({
      ...prev,
      followerCount: Math.max(0, previousFollowerCount + (optimisticFollowing ? 1 : -1)),
    }));

    try {
      const response = previousFollowing
        ? await unfollow(authorId)
        : await follow(authorId);

      if (response) {
        setIsFollowing(Boolean(response.following));
        setFollowCounts((prev) => ({
          followerCount: response.followerCount ?? prev.followerCount,
          followingCount: response.followingCount ?? prev.followingCount,
        }));
      }
    } catch (err) {
      console.error('팔로우 처리 실패:', err);
      setIsFollowing(previousFollowing);
      setFollowCounts((prev) => ({
        ...prev,
        followerCount: previousFollowerCount,
      }));
      alert('팔로우 처리에 실패했습니다.');
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}.${month}.${day} ${hours}:${minutes}`;
  };

  return (
    <>
      <GNB />
      <div className="post-detail-container">
        {isLoading ? (
          <div className="post-detail-loading">
            <p>게시글을 불러오는 중...</p>
          </div>
        ) : error ? (
          <div className="post-detail-error">
            <p>{error}</p>
            <button onClick={() => navigate('/posts')} className="back-button">
              목록으로 돌아가기
            </button>
          </div>
        ) : post ? (
          <div className="post-detail-card">
            <div className="post-detail-header">
              <div className="post-detail-author">
                {authorImage ? (
                  <img src={authorImage} alt={authorName} className="post-detail-avatar" />
                ) : (
                  <div className="post-detail-avatar-placeholder">{authorName.charAt(0)}</div>
                )}
                <div className="post-detail-author-info">
                  <span className="post-detail-author-name">{authorName}</span>
                  <span className="post-detail-date">{formatDate(post.createdAt)}</span>
                  <span className="post-detail-follow-meta">
                    팔로워 {followCounts.followerCount} · 팔로잉 {followCounts.followingCount}
                  </span>
                </div>
              </div>

              <div className="post-detail-actions">
                {isOwner ? (
                  <button onClick={handleDelete} className="delete-button">
                    삭제
                  </button>
                ) : (
                  <button
                    type="button"
                    className={`follow-button ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowToggle}
                    disabled={isFollowMutating || isFollowLoading}
                  >
                    {isFollowMutating || isFollowLoading
                      ? '처리 중...'
                      : isFollowing
                        ? '언팔로우'
                        : '팔로우'}
                  </button>
                )}
              </div>
            </div>

            <div className="post-detail-content">
              <p>{post.content}</p>
            </div>

            {post.images && post.images.length > 0 && (
              <div className="post-detail-images">
                {post.images.map((image, index) => (
                  <div key={image.id || index} className="post-detail-image-item">
                    <img
                      src={image.imageUrl || image.url}
                      alt={`게시글 이미지 ${index + 1}`}
                    />
                  </div>
                ))}
              </div>
            )}

            <div className="post-detail-stats">
              <button
                type="button"
                className={`post-detail-like-button ${isPostLiked ? 'active' : ''}`}
                onClick={handleToggleLike}
                disabled={!accessToken || isLikeLoading}
                aria-label={isPostLiked ? '좋아요 취소' : '좋아요'}
              >
                {isLikeLoading ? '처리 중...' : `❤ ${post.likeCount || 0}`}
              </button>
              <span className="post-detail-stat">댓글 {post.commentCount || 0}</span>
              <span className="post-detail-stat">조회 {getViewCount(post)}</span>
            </div>

            {post.visibility && post.visibility !== 'PUBLIC' && (
              <div className="post-detail-visibility">
                {post.visibility === 'PRIVATE' ? '나만 보기' : '팔로워만 공개'}
              </div>
            )}

            <div className="post-detail-footer">
              <button onClick={() => navigate('/posts')} className="back-button">
                목록으로
              </button>
            </div>
          </div>
        ) : null}

        {post && (
          <CommentSection
            postId={post.id}
            onCommentCountChange={handleCommentCountChange}
          />
        )}
      </div>
      <Footer />
    </>
  );
}

export default PostDetail;
