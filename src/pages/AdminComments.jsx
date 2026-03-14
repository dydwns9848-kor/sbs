import { useEffect, useState } from 'react';
import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import './Admin.css';

const PAGE_SIZE = 20;

function AdminComments() {
  const { accessToken } = useAuth();
  const { getComments, deleteComment } = useAdmin(accessToken);

  const [filters, setFilters] = useState({ keyword: '', postId: '', authorId: '' });
  const [page, setPage] = useState(0);
  const [data, setData] = useState({ content: [], totalPages: 0, totalElements: 0 });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchComments = async (nextPage = page, nextFilters = filters) => {
    setIsLoading(true);
    setError(null);
    try {
      const result = await getComments({
        ...nextFilters,
        page: nextPage,
        size: PAGE_SIZE,
      });
      setData(result);
      setPage(nextPage);
    } catch (err) {
      setData({ content: [], totalPages: 0, totalElements: 0 });
      setError('댓글 목록 조회에 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchComments(0, filters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchComments(0, filters);
  };

  const handleDelete = async (item) => {
    if (!item?.id) return;
    const reason = window.prompt('강제 삭제 사유를 입력하세요.', '운영 정책 위반 댓글') || '운영 정책 위반 댓글';
    if (!window.confirm(`댓글 #${item.id} 를 삭제할까요?`)) return;

    try {
      await deleteComment(item.id, { reason });
      fetchComments(page, filters);
    } catch (err) {
      alert('댓글 삭제에 실패했습니다.');
    }
  };

  return (
    <>
      <GNB />
      <main className="admin-page-container">
        <div className="admin-page-header">
          <div>
            <h1>댓글 관리</h1>
            <p>댓글 모니터링과 강제 삭제를 수행합니다.</p>
          </div>
        </div>
        <AdminNav />

        <section className="admin-card">
          <form className="admin-toolbar" onSubmit={handleSearchSubmit}>
            <input
              placeholder="댓글 내용 검색"
              value={filters.keyword}
              onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))}
            />
            <input
              placeholder="게시물 ID"
              value={filters.postId}
              onChange={(e) => setFilters((prev) => ({ ...prev, postId: e.target.value }))}
            />
            <input
              placeholder="작성자 ID"
              value={filters.authorId}
              onChange={(e) => setFilters((prev) => ({ ...prev, authorId: e.target.value }))}
            />
            <button type="submit">검색</button>
          </form>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>게시물ID</th>
                  <th>작성자</th>
                  <th>내용</th>
                  <th>작성일</th>
                  <th>액션</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan="6" className="admin-state">불러오는 중...</td></tr>
                ) : error ? (
                  <tr><td colSpan="6" className="admin-state">{error}</td></tr>
                ) : data.content.length === 0 ? (
                  <tr><td colSpan="6" className="admin-state">조회 결과가 없습니다.</td></tr>
                ) : data.content.map((item) => (
                  <tr key={item.id}>
                    <td>{item.id}</td>
                    <td>{item.postId || item.post?.id || '-'}</td>
                    <td>{item.author?.name || item.userName || item.authorId || '-'}</td>
                    <td>{String(item.content || '').slice(0, 100) || '-'}</td>
                    <td>{item.createdAt ? new Date(item.createdAt).toLocaleString('ko-KR') : '-'}</td>
                    <td>
                      <div className="admin-actions">
                        <button type="button" className="admin-action-btn danger" onClick={() => handleDelete(item)}>
                          강제삭제
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="admin-pagination">
            <button className="admin-page-btn" type="button" onClick={() => fetchComments(Math.max(0, page - 1), filters)} disabled={page === 0 || isLoading}>이전</button>
            <span>{page + 1} / {Math.max(1, data.totalPages || 1)}</span>
            <button className="admin-page-btn" type="button" onClick={() => fetchComments(page + 1, filters)} disabled={isLoading || (data.totalPages > 0 && page >= data.totalPages - 1)}>다음</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminComments;
