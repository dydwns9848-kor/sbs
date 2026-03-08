import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';

import Footer from '../components/Footer';
import GNB from '../components/Gnb';
import defaultUserImage from '../assets/default_user.png';
import { useAuth } from '../hooks/useAuth';
import { useDm } from '../hooks/useDm';
import './Dm.css';

const ROOM_PAGE_SIZE = 50;
const MESSAGE_PAGE_SIZE = 30;

function Dm() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated, accessToken, isLoading: authLoading } = useAuth();
  const { createOrGetRoom, getMyRooms, getMessages, sendMessage, markAsRead } = useDm(accessToken);

  const [rooms, setRooms] = useState([]);
  const [roomsLoading, setRoomsLoading] = useState(false);
  const [roomsError, setRoomsError] = useState(null);

  const [selectedRoomId, setSelectedRoomId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [messagesError, setMessagesError] = useState(null);
  const [hasMoreMessages, setHasMoreMessages] = useState(false);

  const [draft, setDraft] = useState('');
  const [isSending, setIsSending] = useState(false);
  const messageBodyRef = useRef(null);
  const targetUserIdParam = useMemo(() => Number(searchParams.get('userId')), [searchParams]);

  const extractUserId = useCallback((target) => (
    target?.id
    ?? target?.userId
    ?? target?.memberId
    ?? target?.accountId
    ?? target?.uid
    ?? null
  ), []);

  const normalizeUser = useCallback((target) => {
    if (!target || typeof target !== 'object') {
      return { id: null, name: '알 수 없음', profileImage: null };
    }
    const id = extractUserId(target);
    const name = target.name
      ?? target.userName
      ?? target.username
      ?? target.nickname
      ?? target.displayName
      ?? (id ? `사용자 ${id}` : '알 수 없음');

    return {
      id,
      name,
      profileImage: target.profileImage
        ?? target.userProfileImage
        ?? target.avatar
        ?? target.avatarUrl
        ?? target.imageUrl
        ?? null,
    };
  }, [extractUserId]);

  const normalizeRoom = useCallback((room) => {
    const members = Array.isArray(room?.participants)
      ? room.participants
      : Array.isArray(room?.members)
        ? room.members
        : [];
    const normalizedMembers = members.map((member) => normalizeUser(member?.user || member));
    const partnerFromMembers = normalizedMembers.find(
      (member) => Number(member?.id) && Number(member?.id) !== Number(user?.id)
    );

    const partnerFromFlatFields = normalizeUser({
      id: room?.targetUserId
        ?? room?.otherUserId
        ?? room?.opponentUserId
        ?? room?.partnerUserId
        ?? room?.receiverId
        ?? room?.chatPartnerId
        ?? null,
      name: room?.targetUserName
        ?? room?.otherUserName
        ?? room?.opponentName
        ?? room?.partnerName
        ?? room?.receiverName
        ?? room?.chatPartnerName
        ?? room?.lastMessage?.senderName
        ?? null,
      profileImage: room?.targetUserProfileImage
        ?? room?.otherUserProfileImage
        ?? room?.opponentProfileImage
        ?? room?.partnerProfileImage
        ?? room?.receiverProfileImage
        ?? room?.chatPartnerProfileImage
        ?? null,
    });

    const partnerCandidate =
      room?.targetUser
      || room?.otherUser
      || room?.opponent
      || room?.partner
      || partnerFromMembers
      || partnerFromFlatFields;
    const partner = normalizeUser(partnerCandidate);

    return {
      id: room?.roomId ?? room?.id ?? null,
      partner,
      lastMessage: room?.lastMessage?.content ?? room?.lastMessageContent ?? room?.lastMessageText ?? '',
      lastMessageAt: room?.lastMessageAt ?? room?.updatedAt ?? room?.lastMessage?.createdAt ?? null,
      unreadCount: Number(room?.unreadCount ?? room?.unReadCount ?? 0),
    };
  }, [normalizeUser, user?.id]);

  const normalizeMessage = useCallback((message) => {
    const sender = message?.sender || message?.user || null;
    const senderId = message?.senderId ?? message?.userId ?? sender?.id ?? null;
    const senderName = message?.senderName ?? sender?.name ?? sender?.userName ?? '사용자';
    const createdAt = message?.createdAt ?? message?.sentAt ?? message?.createdDate ?? new Date().toISOString();

    return {
      id: message?.messageId ?? message?.id ?? `tmp-${Date.now()}`,
      roomId: message?.roomId ?? message?.dmRoomId ?? selectedRoomId,
      senderId,
      senderName,
      content: message?.content ?? message?.message ?? '',
      createdAt,
      isMine: Number(senderId) === Number(user?.id),
    };
  }, [selectedRoomId, user?.id]);

  const selectedRoom = useMemo(
    () => rooms.find((room) => Number(room.id) === Number(selectedRoomId)) || null,
    [rooms, selectedRoomId]
  );

  const extractList = (payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) return payload;
    if (Array.isArray(payload.content)) return payload.content;
    if (Array.isArray(payload.rooms)) return payload.rooms;
    if (Array.isArray(payload.items)) return payload.items;
    if (Array.isArray(payload.list)) return payload.list;
    return [];
  };

  const sortByLatest = (nextRooms) => [...nextRooms].sort((a, b) => {
    const aTime = new Date(a.lastMessageAt || 0).getTime();
    const bTime = new Date(b.lastMessageAt || 0).getTime();
    return bTime - aTime;
  });

  const sortMessages = (nextMessages) => [...nextMessages].sort((a, b) => {
    const aTime = new Date(a.createdAt || 0).getTime();
    const bTime = new Date(b.createdAt || 0).getTime();
    if (aTime === bTime) {
      return Number(a.id) - Number(b.id);
    }
    return aTime - bTime;
  });

  const fetchRooms = useCallback(async () => {
    setRoomsLoading(true);
    setRoomsError(null);

    try {
      const raw = await getMyRooms(0, ROOM_PAGE_SIZE);
      const normalized = extractList(raw)
        .map(normalizeRoom)
        .filter((room) => room.id);
      const sorted = sortByLatest(normalized);
      setRooms(sorted);
      setSelectedRoomId((prev) => (prev ? prev : sorted[0]?.id ?? null));
    } catch (err) {
      setRooms([]);
      setRoomsError('DM 방 목록을 불러오지 못했습니다.');
    } finally {
      setRoomsLoading(false);
    }
  }, [getMyRooms, normalizeRoom]);

  const fetchMessages = useCallback(async (roomId, { beforeId, reset = false } = {}) => {
    if (!roomId) return;
    setMessagesLoading(true);
    setMessagesError(null);

    try {
      const raw = await getMessages(roomId, beforeId, MESSAGE_PAGE_SIZE);
      const list = extractList(raw?.messages ? raw.messages : raw)
        .map(normalizeMessage)
        .filter((message) => message.id && message.content !== undefined);

      setHasMoreMessages(Boolean(
        raw?.hasNext ?? raw?.hasMore ?? raw?.nextExists ?? (list.length >= MESSAGE_PAGE_SIZE)
      ));

      setMessages((prev) => {
        const merged = reset ? list : [...list, ...prev];
        const uniq = new Map();
        merged.forEach((message) => {
          uniq.set(message.id, message);
        });
        return sortMessages(Array.from(uniq.values()));
      });

      const lastMessage = sortMessages(list).at(-1);
      if (lastMessage?.id) {
        markAsRead(roomId, lastMessage.id).catch(() => {});
      }
    } catch (err) {
      if (reset) {
        setMessages([]);
      }
      setMessagesError('메시지를 불러오지 못했습니다.');
    } finally {
      setMessagesLoading(false);
    }
  }, [getMessages, markAsRead, normalizeMessage]);

  const handleLoadMoreMessages = async () => {
    if (!selectedRoomId || messages.length === 0 || !hasMoreMessages || messagesLoading) return;
    const oldestMessageId = messages[0]?.id;
    if (!oldestMessageId) return;
    await fetchMessages(selectedRoomId, { beforeId: oldestMessageId, reset: false });
  };

  const formatRoomTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    const now = new Date();
    const diffMs = now - date;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

    if (diffHours < 24) {
      return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const formatMessageTime = (value) => {
    if (!value) return '';
    const date = new Date(value);
    return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedRoomId || isSending) return;

    const trimmed = draft.trim();
    if (!trimmed) return;

    const optimistic = {
      id: `temp-${Date.now()}`,
      roomId: selectedRoomId,
      senderId: user?.id,
      senderName: user?.name || '나',
      content: trimmed,
      createdAt: new Date().toISOString(),
      isMine: true,
    };

    setDraft('');
    setIsSending(true);
    setMessages((prev) => sortMessages([...prev, optimistic]));

    try {
      const sentRaw = await sendMessage(selectedRoomId, trimmed);
      const sent = normalizeMessage(sentRaw);

      setMessages((prev) => {
        const replaced = prev.map((message) => (message.id === optimistic.id ? sent : message));
        return sortMessages(replaced);
      });

      setRooms((prev) => sortByLatest(prev.map((room) => (
        Number(room.id) === Number(selectedRoomId)
          ? {
              ...room,
              lastMessage: sent.content,
              lastMessageAt: sent.createdAt,
            }
          : room
      ))));

      markAsRead(selectedRoomId, sent.id).catch(() => {});
    } catch (err) {
      setMessages((prev) => prev.filter((message) => message.id !== optimistic.id));
      alert('메시지 전송에 실패했습니다.');
    } finally {
      setIsSending(false);
    }
  };

  useEffect(() => {
    if (authLoading || !isAuthenticated || !accessToken) return;
    fetchRooms();
  }, [authLoading, isAuthenticated, accessToken, fetchRooms]);

  useEffect(() => {
    if (!selectedRoomId) {
      setMessages([]);
      return;
    }
    fetchMessages(selectedRoomId, { reset: true });
  }, [selectedRoomId, fetchMessages]);

  useEffect(() => {
    if (!isAuthenticated || authLoading || !accessToken) return;

    if (!targetUserIdParam || Number.isNaN(targetUserIdParam) || Number(targetUserIdParam) === Number(user?.id)) return;

    const openTargetRoom = async () => {
      try {
        const room = await createOrGetRoom(targetUserIdParam);
        const normalized = normalizeRoom(room);
        if (!normalized.id) return;

        setRooms((prev) => {
          const exists = prev.some((item) => Number(item.id) === Number(normalized.id));
          const next = exists
            ? prev.map((item) => (Number(item.id) === Number(normalized.id) ? normalized : item))
            : [normalized, ...prev];
          return sortByLatest(next);
        });
        setSelectedRoomId(normalized.id);
        navigate('/dm', { replace: true });
      } catch (err) {
        alert('DM 방을 여는 데 실패했습니다.');
      }
    };

    openTargetRoom();
  }, [authLoading, isAuthenticated, accessToken, targetUserIdParam, user?.id, createOrGetRoom, normalizeRoom, navigate]);

  useEffect(() => {
    if (!messageBodyRef.current) return;
    messageBodyRef.current.scrollTop = messageBodyRef.current.scrollHeight;
  }, [messages.length, selectedRoomId]);

  if (authLoading) {
    return (
      <>
        <GNB />
        <main className="dm-container">
          <div className="dm-state-card">DM 화면을 준비하는 중...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <GNB />
        <main className="dm-container">
          <div className="dm-state-card">
            <p>DM은 로그인 후 이용할 수 있습니다.</p>
            <Link to="/login" className="dm-login-link">로그인하러 가기</Link>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <GNB />
      <main className="dm-container">
        <div className="dm-shell">
          <aside className="dm-room-list">
            <div className="dm-room-list-header">
              <h1>DM</h1>
              <button type="button" onClick={fetchRooms} className="dm-refresh-btn">
                새로고침
              </button>
            </div>

            {roomsLoading ? (
              <p className="dm-state-text">대화방을 불러오는 중...</p>
            ) : roomsError ? (
              <p className="dm-state-text">{roomsError}</p>
            ) : rooms.length === 0 ? (
              <p className="dm-state-text">대화방이 없습니다.</p>
            ) : (
              <ul className="dm-room-items">
                {rooms.map((room) => (
                  <li key={room.id}>
                    <button
                      type="button"
                      className={`dm-room-item ${Number(selectedRoomId) === Number(room.id) ? 'active' : ''}`}
                      onClick={() => setSelectedRoomId(room.id)}
                    >
                      <img
                        src={room.partner.profileImage || defaultUserImage}
                        alt={room.partner.name}
                        className="dm-avatar"
                      />
                      <div className="dm-room-meta">
                        <div className="dm-room-line">
                          <strong>{room.partner.name}</strong>
                          <span>{formatRoomTime(room.lastMessageAt)}</span>
                        </div>
                        <div className="dm-room-line">
                          <p>{room.lastMessage || '메시지를 시작해 보세요.'}</p>
                          {room.unreadCount > 0 && <em>{room.unreadCount}</em>}
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </aside>

          <section className="dm-room-panel">
            {!selectedRoom ? (
              <div className="dm-panel-empty">대화방을 선택해 주세요.</div>
            ) : (
              <>
                <header className="dm-panel-header">
                  <button
                    type="button"
                    className="dm-panel-user"
                    onClick={() => navigate(`/users/${selectedRoom.partner.id}`)}
                  >
                    <img
                      src={selectedRoom.partner.profileImage || defaultUserImage}
                      alt={selectedRoom.partner.name}
                      className="dm-avatar"
                    />
                    <div>
                      <strong>{selectedRoom.partner.name}</strong>
                      <p>@{selectedRoom.partner.id || '-'}</p>
                    </div>
                  </button>
                </header>

                <div className="dm-message-body" ref={messageBodyRef}>
                  {hasMoreMessages && (
                    <button
                      type="button"
                      className="dm-load-more-btn"
                      onClick={handleLoadMoreMessages}
                      disabled={messagesLoading}
                    >
                      이전 메시지 더보기
                    </button>
                  )}

                  {messagesLoading && messages.length === 0 ? (
                    <p className="dm-state-text">메시지를 불러오는 중...</p>
                  ) : messagesError ? (
                    <p className="dm-state-text">{messagesError}</p>
                  ) : messages.length === 0 ? (
                    <p className="dm-state-text">아직 메시지가 없습니다.</p>
                  ) : (
                    <ul className="dm-message-list">
                      {messages.map((message) => (
                        <li
                          key={message.id}
                          className={`dm-message-item ${message.isMine ? 'mine' : ''}`}
                        >
                          <div className="dm-bubble">
                            {!message.isMine && <strong>{message.senderName}</strong>}
                            <p>{message.content}</p>
                            <span>{formatMessageTime(message.createdAt)}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>

                <form className="dm-input-form" onSubmit={handleSendMessage}>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    placeholder="메시지를 입력하세요"
                    rows={2}
                    maxLength={2000}
                  />
                  <button type="submit" disabled={!draft.trim() || isSending}>
                    {isSending ? '전송 중...' : '전송'}
                  </button>
                </form>
              </>
            )}
          </section>
        </div>
      </main>
      <Footer />
    </>
  );
}

export default Dm;
