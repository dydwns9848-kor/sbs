import { useEffect, useState } from 'react';
import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import AdminNav from '../components/AdminNav';
import { useAuth } from '../hooks/useAuth';
import { useAdmin } from '../hooks/useAdmin';
import './Admin.css';

const SIGNUP_WINDOW_DAYS = 7;
const USERS_PAGE_SIZE = 100;
const USERS_PAGE_LIMIT = 20;

function toDateKey(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toLabel(dateKey) {
  const [year, month, day] = dateKey.split('-');
  return `${year}.${month}.${day}`;
}

function createSignupDateKeys(windowDays = SIGNUP_WINDOW_DAYS) {
  const keys = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  for (let offset = windowDays - 1; offset >= 0; offset -= 1) {
    const cursor = new Date(now);
    cursor.setDate(now.getDate() - offset);
    keys.push(toDateKey(cursor));
  }

  return keys;
}

function AdminDashboard() {
  const { accessToken } = useAuth();
  const { getDashboardSummary, getUsers } = useAdmin(accessToken);

  const [summary, setSummary] = useState(null);
  const [dailySignups, setDailySignups] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [summaryData, usersPage0] = await Promise.all([
          getDashboardSummary(),
          getUsers({
            page: 0,
            size: USERS_PAGE_SIZE,
            sort: 'createdAt,desc',
          }),
        ]);

        setSummary(summaryData || {});

        const dateKeys = createSignupDateKeys();
        const startDate = new Date(dateKeys[0]);
        const countByDate = dateKeys.reduce((acc, key) => ({ ...acc, [key]: 0 }), {});

        const collectUsers = [];
        const totalPages = Math.min(
          Math.max(1, Number(usersPage0?.totalPages || 1)),
          USERS_PAGE_LIMIT
        );
        collectUsers.push(...(Array.isArray(usersPage0?.content) ? usersPage0.content : []));

        let currentPage = 1;
        let shouldStop = false;
        while (currentPage < totalPages && !shouldStop) {
          const usersData = await getUsers({
            page: currentPage,
            size: USERS_PAGE_SIZE,
            sort: 'createdAt,desc',
          });
          const content = Array.isArray(usersData?.content) ? usersData.content : [];
          collectUsers.push(...content);

          // createdAt 내림차순일 때 최근 N일 범위를 지난 지점부터 조회를 멈춥니다.
          const hasOlder = content.some((user) => {
            const createdAt = user?.createdAt || user?.createdDate || user?.joinedAt;
            if (!createdAt) return false;
            const parsed = new Date(createdAt);
            if (Number.isNaN(parsed.getTime())) return false;
            return parsed < startDate;
          });

          if (hasOlder) shouldStop = true;
          currentPage += 1;
        }

        collectUsers.forEach((user) => {
          const createdAt = user?.createdAt || user?.createdDate || user?.joinedAt;
          if (!createdAt) return;
          const parsed = new Date(createdAt);
          if (Number.isNaN(parsed.getTime())) return;
          const key = toDateKey(parsed);
          if (Object.prototype.hasOwnProperty.call(countByDate, key)) {
            countByDate[key] += 1;
          }
        });

        const signupRows = dateKeys.map((key) => ({
          dateKey: key,
          label: toLabel(key),
          count: countByDate[key] || 0,
        }));

        setDailySignups(signupRows);
      } catch (err) {
        setSummary(null);
        setDailySignups([]);
        setError('대시보드 요약을 불러오지 못했습니다.');
      } finally {
        setIsLoading(false);
      }
    };

    fetchSummary();
  }, [getDashboardSummary, getUsers]);

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
  const maxSignupCount = Math.max(1, ...dailySignups.map((row) => row.count || 0));

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

        <section className="admin-card admin-signup-card">
          <div className="admin-signup-header">
            <h2>일별 가입자 수 (최근 7일)</h2>
          </div>

          {isLoading ? (
            <p className="admin-state">불러오는 중...</p>
          ) : error ? (
            <p className="admin-state">가입자 통계를 불러오지 못했습니다.</p>
          ) : (
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>날짜</th>
                    <th>가입자 수</th>
                    <th>추이</th>
                  </tr>
                </thead>
                <tbody>
                  {dailySignups.map((row) => (
                    <tr key={row.dateKey}>
                      <td>{row.label}</td>
                      <td>{Number(row.count || 0).toLocaleString('ko-KR')}명</td>
                      <td>
                        <div className="admin-signup-bar-track" aria-hidden="true">
                          <span
                            className="admin-signup-bar-fill"
                            style={{ width: `${Math.max(4, (row.count / maxSignupCount) * 100)}%` }}
                          />
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default AdminDashboard;
