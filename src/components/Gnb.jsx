import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Gnb.css';
import defaultUserImage from '../assets/default_user.png';

function GNB() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const profilePath = user?.id ? `/users/${user.id}` : '/profile';
  const userAvatarCandidate = user?.profileImage
    ?? user?.userProfileImage
    ?? user?.profileImageUrl
    ?? user?.avatar
    ?? user?.avatarUrl
    ?? null;
  const userAvatar = (
    typeof userAvatarCandidate === 'string'
    && ['null', 'undefined', ''].includes(userAvatarCandidate.trim().toLowerCase())
  )
    ? null
    : userAvatarCandidate;

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

  return (
    <nav className="gnb">
      <div className="gnb-container">
        <div className="gnb-left">
          <Link to="/" className={`gnb-link ${location.pathname === '/' ? 'active' : ''}`}>
            HOME
          </Link>
          <Link to="/feed" className={`gnb-link ${location.pathname.startsWith('/feed') ? 'active' : ''}`}>
            피드
          </Link>
          <Link to="/posts" className={`gnb-link ${location.pathname.startsWith('/posts') ? 'active' : ''}`}>
            게시글
          </Link>
          {isAuthenticated && (
            <Link to="/dm" className={`gnb-link ${location.pathname.startsWith('/dm') ? 'active' : ''}`}>
              DM
            </Link>
          )}
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
                />
                {user?.name || '내 프로필'}
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
