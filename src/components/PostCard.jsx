import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { useAuth } from '../hooks/useAuth';
import { useFollow } from '../hooks/useFollow';
import { getViewCount } from '../utils/viewCount';
import FollowListModal from './FollowListModal';

const followCountCache = new Map();

function PostCard({
  post,
  isAuthenticated,
  onToggleLike,
  isLikeLoading = false,
  onViewed,
}) {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { getFollowCounts } = useFollow(accessToken);

  const [followCounts, setFollowCounts] = useState({ followerCount: 0, followingCount: 0 });
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');

  const liked = Boolean(post?.liked ?? post?.isLiked ?? false);
  const displayViewCount = getViewCount(post);

  const authorName = post.author?.name || post.userName || '알 수 없음';
  const authorImage = post.author?.profileImage || post.userProfileImage || null;
  const authorId = post.author?.id || post.userId || null;

  useEffect(() => {
    let cancelled = false;

    const fetchCounts = async () => {
      if (!authorId) {
        setFollowCounts({ followerCount: 0, followingCount: 0 });
        return;
      }

      const cached = followCountCache.get(authorId);
      if (cached) {
        setFollowCounts(cached);
        return;
      }

      try {
        const counts = await getFollowCounts(authorId);
        const normalized = {
          followerCount: Number(counts?.followerCount || 0),
          followingCount: Number(counts?.followingCount || 0),
        };

        followCountCache.set(authorId, normalized);
        if (!cancelled) {
          setFollowCounts(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setFollowCounts({ followerCount: 0, followingCount: 0 });
        }
      }
    };

    fetchCounts();

    return () => {
      cancelled = true;
    };
  }, [authorId, getFollowCounts]);

  const formatTime = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    const diffHour = Math.floor(diffMin / 60);
    const diffDay = Math.floor(diffHour / 24);

    if (diffMin < 1) return '방금 전';
    if (diffMin < 60) return `${diffMin}분 전`;
    if (diffHour < 24) return `${diffHour}시간 전`;
    if (diffDay < 7) return `${diffDay}일 전`;
    return date.toLocaleDateString('ko-KR');
  };

  const previewContent = post.content?.length > 150
    ? `${post.content.substring(0, 150)}...`
    : post.content;

  const handleLikeClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!isAuthenticated || !onToggleLike || isLikeLoading) return;
    await onToggleLike(post.id);
  };

  const handleCardClick = () => {
    if (onViewed) {
      onViewed(post.id);
    }
  };

  const handleOpenFollowModal = (e, tab) => {
    e.preventDefault();
    e.stopPropagation();
    setFollowModalTab(tab);
    setIsFollowModalOpen(true);
  };

  const handleAuthorClick = (e) => {
    if (!authorId) return;
    e.preventDefault();
    e.stopPropagation();
    navigate(`/users/${authorId}`, {
      state: {
        authorName,
        authorImage,
      },
    });
  };

  return (
    <>
      <Link to={`/posts/${post.id}`} className="post-card" onClick={handleCardClick}>
      <div className="post-card-header">
        <div className="post-card-author post-card-author-clickable" onClick={handleAuthorClick} role="button" tabIndex={0} onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') handleAuthorClick(e);
        }}>
          {authorImage ? (
            <img src={authorImage} alt={authorName} className="post-card-avatar" />
          ) : (
            <div className="post-card-avatar-placeholder">
              {authorName.charAt(0)}
            </div>
          )}
          <div className="post-card-author-info">
            <span className="post-card-author-name">{authorName}</span>
            <div className="post-card-follow-meta-actions">
              <button
                type="button"
                className="post-card-follow-meta"
                onClick={(e) => handleOpenFollowModal(e, 'followers')}
              >
                팔로워 {followCounts.followerCount}
              </button>
              <span>·</span>
              <button
                type="button"
                className="post-card-follow-meta"
                onClick={(e) => handleOpenFollowModal(e, 'followings')}
              >
                팔로잉 {followCounts.followingCount}
              </button>
            </div>
          </div>
        </div>
        <span className="post-card-time">{formatTime(post.createdAt)}</span>
      </div>

      <div className="post-card-content">
        <p>{previewContent}</p>
      </div>

      {(post.thumbnailUrl || (post.images && post.images.length > 0)) && (
        <div className="post-card-thumbnail">
          <img
            src={post.thumbnailUrl || post.images[0]?.imageUrl || post.images[0]?.thumbnailUrl}
            alt="게시글 이미지"
          />
          {(post.imageCount > 1 || (post.images && post.images.length > 1)) && (
            <span className="post-card-image-count">
              +{(post.imageCount || post.images?.length) - 1}
            </span>
          )}
        </div>
      )}

      <div className="post-card-footer">
        <button
          type="button"
          className={`post-card-like-button ${liked ? 'active' : ''}`}
          onClick={handleLikeClick}
          disabled={!isAuthenticated || isLikeLoading}
          aria-label={liked ? '좋아요 취소' : '좋아요'}
        >
          {isLikeLoading ? '처리 중...' : `❤ ${post.likeCount || 0}`}
        </button>
        <span className="post-card-stat">댓글 {post.commentCount || 0}</span>
        <span className="post-card-stat">조회 {displayViewCount}</span>
      </div>

      </Link>

      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        authorId={authorId}
        authorName={authorName}
        initialTab={followModalTab}
        accessToken={accessToken}
      />
    </>
  );
}

export default PostCard;
