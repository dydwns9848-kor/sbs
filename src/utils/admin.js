export function isAdminUser(user) {
  if (!user) return false;
  const role = String(user.role || '').toUpperCase();
  return role === 'ROLE_ADMIN' || role === 'ADMIN' || Boolean(user.isSuperUser);
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
