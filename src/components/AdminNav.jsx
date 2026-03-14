import { NavLink } from 'react-router-dom';
import './AdminNav.css';

const items = [
  { to: '/admin', label: '대시보드', end: true },
  { to: '/admin/users', label: '사용자' },
  { to: '/admin/posts', label: '게시물' },
  { to: '/admin/comments', label: '댓글' },
  { to: '/admin/audit-logs', label: '감사로그' },
];

function AdminNav() {
  return (
    <div className="admin-nav">
      {items.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.end}
          className={({ isActive }) => `admin-nav-link ${isActive ? 'active' : ''}`}
        >
          {item.label}
        </NavLink>
      ))}
    </div>
  );
}

export default AdminNav;
