import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import axios from 'axios';
import GNB from './Gnb';
import Footer from './Footer';
import { useAuth } from '../hooks/useAuth';
import { isAdminUser } from '../utils/admin';
import { API_CONFIG } from '../config';
import '../pages/Admin.css';

function AdminGuard() {
  const { user, isLoading, isAuthenticated, accessToken } = useAuth();
  const [hasAdminAccess, setHasAdminAccess] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    let cancelled = false;

    const verifyAdmin = async () => {
      if (!isAuthenticated || !accessToken) {
        if (!cancelled) {
          setHasAdminAccess(false);
          setIsCheckingAccess(false);
        }
        return;
      }

      if (isAdminUser(user)) {
        if (!cancelled) {
          setHasAdminAccess(true);
          setIsCheckingAccess(false);
        }
        return;
      }

      try {
        await axios.get(`${API_CONFIG.baseUrl}${API_CONFIG.endpoints.admin.dashboardSummary}`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });
        if (!cancelled) {
          setHasAdminAccess(true);
          setIsCheckingAccess(false);
        }
      } catch (error) {
        if (!cancelled) {
          setHasAdminAccess(false);
          setIsCheckingAccess(false);
        }
      }
    };

    verifyAdmin();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated, accessToken, user]);

  if (isLoading || isCheckingAccess) {
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

  if (!hasAdminAccess) {
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
