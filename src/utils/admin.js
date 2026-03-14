export function isAdminUser(user) {
  if (!user) return false;
  const role = String(user.role || user.userRole || user.authority || '').toUpperCase();

  const authorities = Array.isArray(user.authorities) ? user.authorities : [];
  const roles = Array.isArray(user.roles) ? user.roles : [];
  const authorityValues = [...authorities, ...roles]
    .map((item) => {
      if (typeof item === 'string') return item;
      if (item && typeof item === 'object') {
        return item.authority || item.role || item.name || '';
      }
      return '';
    })
    .map((value) => String(value).toUpperCase());

  const hasAdminAuthority = authorityValues.some((value) => (
    value === 'ROLE_ADMIN' || value === 'ADMIN' || value === 'ROLE_SUPER_ADMIN' || value === 'SUPER_ADMIN'
  ));

  return (
    role === 'ROLE_ADMIN'
    || role === 'ADMIN'
    || role === 'ROLE_SUPER_ADMIN'
    || role === 'SUPER_ADMIN'
    || hasAdminAuthority
    || Boolean(user.isSuperUser)
  );
}

export function normalizePageData(data) {
  if (!data) {
    return {
      content: [],
      totalPages: 0,
      totalElements: 0,
      number: 0,
      size: 0,
    };
  }

  if (Array.isArray(data)) {
    return {
      content: data,
      totalPages: 1,
      totalElements: data.length,
      number: 0,
      size: data.length,
    };
  }

  return {
    content: Array.isArray(data.content) ? data.content : [],
    totalPages: Number(data.totalPages || 0),
    totalElements: Number(data.totalElements || 0),
    number: Number(data.number || 0),
    size: Number(data.size || 0),
  };
}
