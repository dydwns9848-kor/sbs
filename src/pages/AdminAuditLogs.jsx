import { useEffect, useState } from 'react';
import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import './Admin.css';

const PAGE_SIZE = 20;

function AdminAuditLogs() {
  const { accessToken } = useAuth();
  const { getAuditLogs } = useAdmin(accessToken);

  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchLogs = async (nextPage = page) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getAuditLogs({
        page: nextPage,
        size: PAGE_SIZE,
      });
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setData({ content: [], totalPages: 0, totalElements: 0 });
      setError('감사 로그 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <GNB />
      <main className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <h1>관리자 감사 로그</h1>
            <p>관리자 액션 추적 이력을 확인합니다.</p>
          </div>
        </div>
        <AdminNav />

        <section className="admin-card">
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>관리자ID</th>
                  <th>액션</th>
                  <th>대상</th>
                  <th>사유</th>
                  <th>시각</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="admin-state">불러오는 중...</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="admin-state">{error}</td></tr>
                ) : data.content.length === 0 ? (
                  <tr><td colSpan="6" className="admin-state">로그가 없습니다.</td></tr>
                ) : data.content.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.adminUserId || item.adminId || item.admin?.id || '-'}</td>
                    <td>{item.actionType || item.action || '-'}</td>
                    <td>{`${item.targetType || '-'}:${item.targetId || '-'}`}</td>
                    <td>{item.reason || '-'}</td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-page-btn" type="button" onClick={() => fetchLogs(Math.max(0, page - 1))} disabled={page === 0 || isLoading}>이전</button>
            <span>{page + 1} / {Math.max(1, data.totalPages || 1)}</span>
            <button className="admin-page-btn" type="button" onClick={() => fetchLogs(page + 1)} disabled={isLoading || (data.totalPages > 0 && page >= data.totalPages - 1)}>다음</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminAuditLogs;
