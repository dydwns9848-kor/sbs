import { useEffect, useState } from 'react';
import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import './Admin.css';

const PAGE_SIZE = 20;

function AdminUsers() {
  const { accessToken, user: authUser } = useAuth();
  const { getUsers, updateUserStatus, updateUserRole } = useAdmin(accessToken);

  const [filters, setFilters] = useState({ keyword: '', status: '', role: '' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchUsers = async (nextPage = page, nextFilters = filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getUsers({
        ...nextFilters,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setData({ content: [], totalPages: 0, totalElements: 0 });
      setError('사용자 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers(0, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchUsers(0, filters);
  };

  const handleStatusChange = async (targetUser, status) => {
    if (!targetUser?.id) return;
    const reason = window.prompt('변경 사유를 입력하세요.', '관리자 조치') || '관리자 조치';

    try {
      await updateUserStatus(targetUser.id, {
        status,
        reason,
      });
      fetchUsers(page, filters);
    } catch (err) {
      alert('상태 변경에 실패했습니다.');
    }
  };

  const handleRoleToggle = async (targetUser) => {
    if (!targetUser?.id) return;
    const isAdmin = String(targetUser.role || '').toUpperCase().includes('ADMIN');
    const nextRole = isAdmin ? 'ROLE_USER' : 'ROLE_ADMIN';
    const reason = window.prompt('권한 변경 사유를 입력하세요.', '운영 권한 조정') || '운영 권한 조정';

    try {
      await updateUserRole(targetUser.id, {
        role: nextRole,
        reason,
      });
      fetchUsers(page, filters);
    } catch (err) {
      alert('권한 변경에 실패했습니다.');
    }
  };

  return (
    <>
      <GNB />
      <main className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <h1>사용자 관리</h1>
            <p>사용자 상태와 권한을 관리합니다.</p>
          </div>
        </div>
        <AdminNav />

        <section className="admin-card">
          <form className="admin-toolbar" onSubmit={handleSearchSubmit}>
            <input
              placeholder="이메일/이름 검색"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            />
            <select
              value={filters.status}
              onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
            >
              <option value="">상태 전체</option>
              <option value="ACTIVE">ACTIVE</option>
              <option value="INACTIVE">INACTIVE</option>
              <option value="SUSPENDED">SUSPENDED</option>
              <option value="DELETED">DELETED</option>
            </select>
            <select
              value={filters.role}
              onChange={(e) => setFilters((prev) => ({ ...prev, role: e.target.value }))}
            >
              <option value="">권한 전체</option>
              <option value="ROLE_USER">ROLE_USER</option>
              <option value="ROLE_ADMIN">ROLE_ADMIN</option>
            </select>
            <button type="submit">검색</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>이메일</th>
                  <th>이름</th>
                  <th>상태</th>
                  <th>권한</th>
                  <th>가입일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="7" className="admin-state">불러오는 중...</td></tr>
                ) : error ? (
                  <tr><td colSpan="7" className="admin-state">{error}</td></tr>
                ) : data.content.length === 0 ? (
                  <tr><td colSpan="7" className="admin-state">조회 결과가 없습니다.</td></tr>
                ) : data.content.map((item) => {
                  const isMe = Number(authUser?.id) === Number(item.id);
                  return (
                    <tr key={item.id}>
                      <td>{item.id}</td>
                      <td>{item.email || '-'}</td>
                      <td>{item.name || item.nickname || '-'}</td>
                      <td>{item.status || '-'}</td>
                      <td>{item.role || '-'}</td>
                      <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}</td>
                      <td>
                        <div className="admin-actions">
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => handleStatusChange(item, 'ACTIVE')}
                            disabled={isMe}
                          >
                            활성
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => handleStatusChange(item, 'SUSPENDED')}
                            disabled={isMe}
                          >
                            정지
                          </button>
                          <button
                            type="button"
                            className="admin-action-btn"
                            onClick={() => handleRoleToggle(item)}
                            disabled={isMe}
                          >
                            권한변경
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-page-btn" type="button" onClick={() => fetchUsers(Math.max(0, page - 1), filters)} disabled={page === 0 || isLoading}>이전</button>
            <span>{page + 1} / {Math.max(1, data.totalPages || 1)}</span>
            <button className="admin-page-btn" type="button" onClick={() => fetchUsers(page + 1, filters)} disabled={isLoading || (data.totalPages > 0 && page >= data.totalPages - 1)}>다음</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminUsers;
