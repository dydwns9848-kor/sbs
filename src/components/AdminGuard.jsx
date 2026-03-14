import { Navigate, Outlet } from 'react-router-dom';
import GNB from './Gnb';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../utils/admin';

function AdminGuard() {
  const { user, isLoading, isAuthenticated } = useAuth();

  if (isLoading) {
    return (
      <>
        <GNB />
        <main className="admin-access-state">관리자 페이지를 준비하는 중...</main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (!isAdminUser(user)) {
    return (
      <>
        <GNB />
        <main className="admin-access-state">관리자 권한이 없어 접근할 수 없습니다.</main>
        <Footer />
      </>
    );
  }

  return <Outlet />;
}

export default AdminGuard;
