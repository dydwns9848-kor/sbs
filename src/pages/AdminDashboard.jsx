import { useEffect, useState } from 'react';
import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import './Admin.css';

function AdminDashboard() {
  const { accessToken } = useAuth();
  const { getDashboardSummary } = useAdmin(accessToken);

  const [summary, setSummary] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const data = await getDashboardSummary();
        setSummary(data || {});
      } catch (err) {
        setSummary(null);
        setError('대시보드 요약을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [getDashboardSummary]);

  const kpis = [
    { key: 'totalUsers', label: '전체 사용자' },
    { key: 'activeUsers', label: '활성 사용자' },
    { key: 'suspendedUsers', label: '정지 사용자' },
    { key: 'inactiveUsers', label: '비활성 사용자' },
    { key: 'totalPosts', label: '전체 게시물' },
    { key: 'activePosts', label: '활성 게시물' },
    { key: 'deletedPosts', label: '삭제 게시물' },
    { key: 'totalComments', label: '전체 댓글' },
  ];

  return (
    <>
      <GNB />
      <main className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <h1>관리자 대시보드</h1>
            <p>서비스 핵심 지표를 확인합니다.</p>
          </div>
        </div>
        <AdminNav />

        <section className="admin-card">
          {isLoading ? (
            <p className="admin-state">불러오는 중...</p>
          ) : error ? (
            <p className="admin-state">{error}</p>
          ) : (
            <div className="admin-grid">
              {kpis.map((item) => (
                <article key={item.key} className="admin-kpi">
                  <span>{item.label}</span>
                  <strong>{Number(summary?.[item.key] || 0).toLocaleString('ko-KR')}</strong>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminDashboard;
