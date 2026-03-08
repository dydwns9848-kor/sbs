import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useDm } from '../hooks/useDm';
import './Gnb.css';
import defaultUserImage from '../assets/default_user.png';

function normalizeImageUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const raw = value.trim().replace(/^"+|"+$/g, '');
  if (!raw || ['null', 'undefined'].includes(raw.toLowerCase())) return null;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;
  if (/^https?:\/\//i.test(raw)) return raw;
  if (raw.startsWith('//')) return `${window.location.protocol}${raw}`;
  if (raw.startsWith('/')) return `${window.location.origin}${raw}`;
  return `${window.location.origin}/${raw.replace(/^\.?\//, '')}`;
}

function GNB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout, accessToken } = useAuth();
  const { getMyRooms } = useDm(accessToken);
  const [dmUnreadCount, setDmUnreadCount] = useState(0);

  const profilePath = user?.id ? `/users/${user.id}` : '/profile';
  const userAvatarCandidate = user?.profileImage
    ?? user?.userProfileImage
    ?? user?.profileImageUrl
    ?? user?.profile_image
    ?? user?.profileImg
    ?? user?.avatar
    ?? user?.avatarUrl
    ?? user?.imageUrl
    ?? user?.profile?.profileImage
    ?? user?.profile?.userProfileImage
    ?? user?.profile?.imageUrl
    ?? null;
  const userAvatar = (
    typeof userAvatarCandidate === 'string'
    && ['null', 'undefined', ''].includes(userAvatarCandidate.trim().toLowerCase())
  )
    ? null
    : normalizeImageUrl(userAvatarCandidate);

  const handleLogout = async () => {
    if (!window.confirm('로그아웃 하시겠습니까?')) return;

    try {
      await logout();
      alert('로그아웃되었습니다.');
      navigate('/');
    } catch (error) {
      console.error('로그아웃 처리 중 오류:', error);
      navigate('/');
    }
  };

  const fetchDmUnreadCount = useCallback(async () => {
    if (!isAuthenticated || !accessToken) {
      setDmUnreadCount(0);
      return;
    }

    try {
      const raw = await getMyRooms(0, 50);
      const list = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.content)
          ? raw.content
          : Array.isArray(raw?.rooms)
            ? raw.rooms
            : [];
      const total = list.reduce(
        (sum, room) => sum + Number(room?.unreadCount ?? room?.unReadCount ?? 0),
        0
      );
      setDmUnreadCount(Number.isFinite(total) ? total : 0);
    } catch (error) {
      setDmUnreadCount(0);
    }
  }, [isAuthenticated, accessToken, getMyRooms]);

  useEffect(() => {
    fetchDmUnreadCount();
  }, [fetchDmUnreadCount]);

  useEffect(() => {
    if (!isAuthenticated || !accessToken) return undefined;

    const onFocus = () => {
      fetchDmUnreadCount();
    };
    const onUnreadChanged = (event) => {
      const next = Number(event?.detail?.count);
      if (Number.isFinite(next) && next >= 0) {
        setDmUnreadCount(next);
      } else {
        fetchDmUnreadCount();
      }
    };

    const timer = window.setInterval(fetchDmUnreadCount, 20000);
    window.addEventListener('focus', onFocus);
    window.addEventListener('dm-unread-changed', onUnreadChanged);

    return () => {
      window.clearInterval(timer);
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('dm-unread-changed', onUnreadChanged);
    };
  }, [isAuthenticated, accessToken, fetchDmUnreadCount]);

  return (
    <nav className="gnb">
      <div className="gnb-container">
        <div className="gnb-left">
          <Link to="/" className={`gnb-link ${location.pathname === '/' ? 'active' : ''}`}>
            HOME
          </Link>
          <Link to="/posts" className={`gnb-link ${location.pathname.startsWith('/posts') ? 'active' : ''}`}>
            게시글
          </Link>
          {isAuthenticated && (
            <Link to="/dm" className={`gnb-link ${location.pathname.startsWith('/dm') ? 'active' : ''}`}>
              DM
              {dmUnreadCount > 0 && (
                <span className="gnb-dm-badge">{dmUnreadCount > 99 ? '99+' : dmUnreadCount}</span>
              )}
            </Link>
          )}
          <Link to="/feed" className={`gnb-link ${location.pathname.startsWith('/feed') ? 'active' : ''}`}>
            피드
          </Link>
        </div>

        <div className="gnb-right">
          {isLoading ? (
            <span className="gnb-loading">로딩 중...</span>
          ) : isAuthenticated ? (
            <>
              <Link to={profilePath} className="gnb-user-info">
                <img
                  src={userAvatar || defaultUserImage}
                  alt="프로필"
                  className="gnb-user-avatar"
                  onError={(e) => {
                    e.currentTarget.src = defaultUserImage;
                  }}
                />
                <span className="gnb-user-name">{user?.name || '내 프로필'}</span>
              </Link>
              <button onClick={handleLogout} className="auth-link logout-button" type="button">
                로그아웃
              </button>
            </>
          ) : (
            <>
              <Link to="/login" className="auth-link">
                로그인
              </Link>
              <Link to="/signup" className="auth-link signup">
                회원가입
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}

export default GNB;
