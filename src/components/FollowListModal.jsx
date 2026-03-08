import { useEffect, useMemo, useState } from 'react';
import { useFollow } from '../hooks/useFollow';
import './FollowListModal.css';

function FollowListModal({
  isOpen,
  onClose,
  authorId,
  authorName,
  initialTab = 'followers',
  accessToken,
}) {
  const { getFollowers, getFollowings } = useFollow(accessToken);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [page, setPage] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState({
    content: [],
    totalPages: 1,
    number: 0,
    totalElements: 0,
  });

  useEffect(() => {
    if (!isOpen) return;
    setActiveTab(initialTab);
    setPage(0);
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (!isOpen) return;

    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !authorId) return;

    let cancelled = false;

    const fetchList = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const raw = activeTab === 'followers'
          ? await getFollowers(authorId, page, 10)
          : await getFollowings(authorId, page, 10);

        const normalized = normalizeListResult(raw);

        if (!cancelled) {
          setResult(normalized);
        }
      } catch (err) {
        if (!cancelled) {
          setError('Failed to load list.');
          setResult({
            content: [],
            totalPages: 1,
            number: 0,
            totalElements: 0,
          });
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchList();

    return () => {
      cancelled = true;
    };
  }, [isOpen, authorId, activeTab, page, getFollowers, getFollowings]);

  const normalizeListResult = (payload) => {
    if (!payload) {
      return {
        content: [],
        totalPages: 1,
        number: 0,
        totalElements: 0,
      };
    }

    const source = payload?.data && typeof payload.data === 'object'
      ? payload.data
      : payload;
    const content = Array.isArray(source)
      ? source
      : source?.content || source?.users || source?.items || source?.list || [];

    const totalPages = Number(
      source?.totalPages ?? source?.totalPage ?? source?.pageInfo?.totalPages ?? 1
    );
    const number = Number(
      source?.number ?? source?.page ?? source?.pageNumber ?? source?.pageInfo?.page ?? 0
    );
    const totalElements = Number(
      source?.totalElements ?? source?.totalCount ?? source?.count ?? content.length ?? 0
    );

    return {
      content: Array.isArray(content) ? content : [],
      totalPages: Number.isFinite(totalPages) && totalPages > 0 ? totalPages : 1,
      number: Number.isFinite(number) && number >= 0 ? number : 0,
      totalElements: Number.isFinite(totalElements) && totalElements >= 0 ? totalElements : 0,
    };
  };

  const title = useMemo(
    () => `${authorName || 'User'} · ${activeTab === 'followers' ? 'Followers' : 'Following'}`,
    [authorName, activeTab]
  );

  if (!isOpen) return null;

  return (
    <div className="follow-modal-overlay" onClick={onClose}>
      <div className="follow-modal" onClick={(e) => e.stopPropagation()}>
        <div className="follow-modal-header">
          <h3>{title}</h3>
          <button type="button" className="follow-modal-close" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="follow-modal-tabs">
          <button
            type="button"
            className={`follow-modal-tab ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('followers');
              setPage(0);
            }}
          >
            Followers
          </button>
          <button
            type="button"
            className={`follow-modal-tab ${activeTab === 'followings' ? 'active' : ''}`}
            onClick={() => {
              setActiveTab('followings');
              setPage(0);
            }}
          >
            Following
          </button>
        </div>

        <div className="follow-modal-body">
          {isLoading ? (
            <p className="follow-modal-state">Loading...</p>
          ) : error ? (
            <p className="follow-modal-state">{error}</p>
          ) : result.content.length === 0 ? (
            <p className="follow-modal-state">No users.</p>
          ) : (
            <ul className="follow-modal-list">
              {result.content.map((u, idx) => {
                const itemId = u?.id || u?.userId || idx;
                const itemName = u?.name || u?.userName || 'Unknown';
                const itemImage = u?.profileImage || u?.userProfileImage || null;
                return (
                  <li key={itemId} className="follow-modal-item">
                    {itemImage ? (
                      <img src={itemImage} alt={itemName} className="follow-modal-avatar" />
                    ) : (
                      <div className="follow-modal-avatar-placeholder">
                        {itemName.charAt(0)}
                      </div>
                    )}
                    <span className="follow-modal-name">{itemName}</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="follow-modal-footer">
          <button
            type="button"
            disabled={result.number <= 0 || isLoading}
            onClick={() => setPage((prev) => Math.max(0, prev - 1))}
          >
            Prev
          </button>
          <span>
            {Math.min(result.number + 1, Math.max(1, result.totalPages))} / {Math.max(1, result.totalPages)}
          </span>
          <button
            type="button"
            disabled={isLoading || result.number >= result.totalPages - 1}
            onClick={() => setPage((prev) => prev + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

export default FollowListModal;
