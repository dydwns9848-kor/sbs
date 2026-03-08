import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import FollowListModal from '../components/FollowListModal';
import { API_CONFIG } from '../config';
import { useAuth } from '../hooks/useAuth';
import { useFollow } from '../hooks/useFollow';
import './UserProfile.css';

async function tryFetchUserPosts(authorId, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const withCredentials = true;

  const candidates = [
    { url: `${API_CONFIG.baseUrl}/users/${authorId}/posts`, params: { page: 0, size: 60 } },
    { url: `${API_CONFIG.baseUrl}/posts/user/${authorId}`, params: { page: 0, size: 60 } },
    { url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}`, params: { page: 0, size: 60, userId: authorId } },
    { url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.feed.explore}`, params: { page: 0, size: 80 } },
    { url: `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}`, params: { page: 0, size: 80 } },
  ];

  for (const req of candidates) {
    try {
      const response = await axios.get(req.url, {
        params: req.params,
        headers,
        withCredentials,
      });
      const data = response.data?.data ?? response.data;
      const posts = Array.isArray(data) ? data : data?.content || [];
      if (!Array.isArray(posts)) continue;

      const filtered = posts.filter((p) => {
        const pid = p?.author?.id || p?.userId;
        return Number(pid) === Number(authorId);
      });

      if (filtered.length > 0) return filtered;
    } catch (err) {
      // 다음 API 시도
    }
  }

  return [];
}

async function tryFetchUserProfile(authorId, accessToken) {
  const headers = accessToken ? { Authorization: `Bearer ${accessToken}` } : {};
  const withCredentials = true;

  const candidates = [
    { url: `${API_CONFIG.baseUrl}/users/${authorId}` },
    { url: `${API_CONFIG.baseUrl}/users/${authorId}/profile` },
    { url: `${API_CONFIG.baseUrl}/users/${authorId}/public` },
    { url: `${API_CONFIG.baseUrl}/users/${authorId}/info` },
    { url: `${API_CONFIG.baseUrl}/user/${authorId}` },
  ];

  for (const req of candidates) {
    try {
      const response = await axios.get(req.url, {
        headers,
        withCredentials,
      });
      const data = response.data?.data ?? response.data ?? null;
      if (!data || typeof data !== 'object') continue;

      const buckets = [data, data.user, data.profile, data.member, data.content, data.result]
        .filter((item) => item && typeof item === 'object');

      for (const bucket of buckets) {
        const bucketId = bucket.id ?? bucket.userId ?? bucket.memberId ?? null;
        if (bucketId && Number(bucketId) !== Number(authorId)) continue;

        const name = bucket.name
          || bucket.userName
          || bucket.username
          || bucket.nickname
          || bucket.nickName
          || bucket.user_name
          || null;
        const profileImage = bucket.profileImage
          || bucket.userProfileImage
          || bucket.profileImageUrl
          || bucket.profile_image
          || bucket.avatar
          || bucket.avatarUrl
          || bucket.imageUrl
          || null;

        if (name || profileImage) {
          return { name, profileImage };
        }
      }
    } catch (err) {
      // 다음 API 시도
    }
  }

  return null;
}

function UserProfile() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, accessToken, isAuthenticated } = useAuth();
  const { getFollowCounts, checkFollowing, follow, unfollow, isMutating: isFollowMutating } = useFollow(accessToken);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posts, setPosts] = useState([]);
  const [profile, setProfile] = useState({
    name: location.state?.authorName || '',
    profileImage: location.state?.authorImage || null,
  });
  const [followCounts, setFollowCounts] = useState({ followerCount: 0, followingCount: 0 });
  const [isFollowing, setIsFollowing] = useState(false);
  const [isFollowModalOpen, setIsFollowModalOpen] = useState(false);
  const [followModalTab, setFollowModalTab] = useState('followers');

  const authorId = Number(id);
  const isOwner = Boolean(user && Number(user.id) === authorId);

  useEffect(() => {
    setProfile({
      name: location.state?.authorName || '',
      profileImage: location.state?.authorImage || null,
    });
    setPosts([]);
  }, [id, location.state?.authorName, location.state?.authorImage]);

  const loadPage = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [counts, following, userPosts, profileResult] = await Promise.all([
        getFollowCounts(authorId),
        isAuthenticated && !isOwner ? checkFollowing(authorId) : Promise.resolve(false),
        tryFetchUserPosts(authorId, accessToken),
        !isOwner ? tryFetchUserProfile(authorId, accessToken) : Promise.resolve(null),
      ]);

      setFollowCounts({
        followerCount: Number(counts?.followerCount || 0),
        followingCount: Number(counts?.followingCount || 0),
      });
      setIsFollowing(Boolean(following));
      setPosts(userPosts);

      if (isOwner && user) {
        setProfile((prev) => ({
          name: user?.name || prev.name,
          profileImage: user?.profileImage || prev.profileImage,
        }));
      } else if (profileResult) {
        setProfile((prev) => ({
          name: profileResult.name || prev.name,
          profileImage: profileResult.profileImage || prev.profileImage,
        }));
      }

      if (userPosts.length > 0) {
        const first = userPosts[0];
        const firstAuthorId = first?.author?.id || first?.userId;
        if (Number(firstAuthorId) === Number(authorId)) {
          const inferredName = first?.author?.name || first?.userName;
          const inferredImage = first?.author?.profileImage || first?.userProfileImage || null;
          setProfile((prev) => ({
            name: inferredName || prev.name,
            profileImage: inferredImage || prev.profileImage,
          }));
        }
      }

      setProfile((prev) => ({
        name: prev.name || `User ${id}`,
        profileImage: prev.profileImage || null,
      }));
    } catch (err) {
      setError('프로필 정보를 불러오지 못했습니다.');
    } finally {
      setIsLoading(false);
    }
  }, [authorId, id, getFollowCounts, checkFollowing, isAuthenticated, isOwner, accessToken, user]);

  useEffect(() => {
    loadPage();
  }, [loadPage]);

  const thumbnailPosts = useMemo(
    () => posts.filter((p) => p?.thumbnailUrl || (p?.images && p.images.length > 0)),
    [posts]
  );

  const handleFollowToggle = async () => {
    if (!isAuthenticated || !accessToken) {
      alert('로그인 후 팔로우할 수 있습니다.');
      navigate('/login');
      return;
    }
    if (isOwner || isFollowMutating) return;

    const prevFollowing = isFollowing;
    const prevCount = followCounts.followerCount || 0;
    const nextFollowing = !prevFollowing;

    setIsFollowing(nextFollowing);
    setFollowCounts((prev) => ({
      ...prev,
      followerCount: Math.max(0, prevCount + (nextFollowing ? 1 : -1)),
    }));

    try {
      const result = prevFollowing ? await unfollow(authorId) : await follow(authorId);
      setIsFollowing(Boolean(result?.following ?? nextFollowing));
      setFollowCounts((prev) => ({
        followerCount: Number(result?.followerCount ?? prev.followerCount),
        followingCount: Number(result?.followingCount ?? prev.followingCount),
      }));
    } catch (err) {
      setIsFollowing(prevFollowing);
      setFollowCounts((prev) => ({ ...prev, followerCount: prevCount }));
      alert('팔로우 처리에 실패했습니다.');
    }
  };

  const handleEditProfile = () => {
    navigate('/profile');
  };

  const handleOpenFollowModal = (tab) => {
    setFollowModalTab(tab);
    setIsFollowModalOpen(true);
  };

  const handleOpenDm = () => {
    navigate(`/dm?userId=${authorId}`, {
      state: {
        targetUserName: profile.name,
        targetUserImage: profile.profileImage || null,
      },
    });
  };

  return (
    <>
      <GNB />
      <div className="user-profile-container">
        {isLoading ? (
          <div className="user-profile-state">프로필을 불러오는 중...</div>
        ) : error ? (
          <div className="user-profile-state">{error}</div>
        ) : (
          <>
            <section className="user-profile-header">
              {profile.profileImage ? (
                <img src={profile.profileImage} alt={profile.name} className="user-profile-avatar" />
              ) : (
                <div className="user-profile-avatar-placeholder">{profile.name.charAt(0)}</div>
              )}

              <div className="user-profile-meta">
                <h1>{profile.name}</h1>
                <div className="user-profile-follow-meta-actions">
                  <button
                    type="button"
                    className="user-profile-follow-meta"
                    onClick={() => handleOpenFollowModal('followers')}
                  >
                    팔로워 {followCounts.followerCount}
                  </button>
                  <span>·</span>
                  <button
                    type="button"
                    className="user-profile-follow-meta"
                    onClick={() => handleOpenFollowModal('followings')}
                  >
                    팔로잉 {followCounts.followingCount}
                  </button>
                </div>
              </div>

              {isOwner ? (
                <button type="button" className="user-profile-edit-btn" onClick={handleEditProfile}>
                  프로필 수정
                </button>
              ) : (
                <div className="user-profile-action-group">
                  <button
                    type="button"
                    className={`user-profile-follow-btn ${isFollowing ? 'following' : ''}`}
                    onClick={handleFollowToggle}
                    disabled={isFollowMutating}
                  >
                    {isFollowMutating ? '처리 중...' : isFollowing ? '언팔로우' : '팔로우'}
                  </button>
                  <button type="button" className="user-profile-dm-btn" onClick={handleOpenDm}>
                    DM 보내기
                  </button>
                </div>
              )}
            </section>

            <section className="user-profile-grid-section">
              <div className="user-profile-grid-title">게시글 {posts.length}개</div>

              {thumbnailPosts.length === 0 ? (
                <div className="user-profile-state">표시할 썸네일 게시글이 없습니다.</div>
              ) : (
                <div className="user-profile-grid">
                  {thumbnailPosts.map((p) => {
                    const thumb = p.thumbnailUrl || p.images?.[0]?.thumbnailUrl || p.images?.[0]?.imageUrl;
                    return (
                      <Link key={p.id} to={`/posts/${p.id}`} className="user-profile-grid-item" title="게시글 보기">
                        <img src={thumb} alt="post thumbnail" />
                      </Link>
                    );
                  })}
                </div>
              )}
            </section>
          </>
        )}
      </div>
      <FollowListModal
        isOpen={isFollowModalOpen}
        onClose={() => setIsFollowModalOpen(false)}
        authorId={authorId}
        authorName={profile.name}
        initialTab={followModalTab}
        accessToken={accessToken}
      />
      <Footer />
    </>
  );
}

export default UserProfile;
