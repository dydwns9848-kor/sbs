import { useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useComments } from '../hooks/useComments';
import './CommentSection.css';

function CommentSection({ postId, onCommentCountChange }) {
  const { user, accessToken, isAuthenticated } = useAuth();
  const {
    comments,
    isLoading,
    error,
    createComment,
    createReply,
    updateComment,
    deleteComment,
    fetchReplies,
    repliesMap,
  } = useComments(postId, accessToken);

  const [newComment, setNewComment] = useState('');
  const [replyContent, setReplyContent] = useState('');
  const [replyingTo, setReplyingTo] = useState(null);
  const [editingId, setEditingId] = useState(null);
  const [editingContent, setEditingContent] = useState('');
  const [expandedReplies, setExpandedReplies] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleNewComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    setIsSubmitting(true);
      try {
        const created = await createComment(newComment.trim());
        if (created) {
          onCommentCountChange?.(1);
          setNewComment('');
        }
      } catch (err) {
      console.error('댓글 작성 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleReplies = async (commentId) => {
    if (!repliesMap[commentId]) {
      await fetchReplies(commentId);
    }
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId],
    }));
  };

  const startReply = (commentId) => {
    setReplyingTo(commentId);
    setReplyContent('');
  };

  const handleReplySubmit = async (commentId) => {
    if (!replyContent.trim()) return;
    setIsSubmitting(true);
    try {
      await createReply(commentId, replyContent.trim());
      setReplyContent('');
      setReplyingTo(null);
    } catch (err) {
      console.error('답글 작성 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (comment) => {
    setEditingId(comment.id);
    setEditingContent(comment.content);
  };

  const handleEditSubmit = async (commentId) => {
    if (!editingContent.trim()) return;
    setIsSubmitting(true);
    try {
      await updateComment(commentId, editingContent.trim());
      setEditingId(null);
      setEditingContent('');
    } catch (err) {
      console.error('댓글 수정 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId) => {
    if (!window.confirm('댓글을 삭제하시겠습니까?')) return;
    setIsSubmitting(true);
    try {
      const deleted = await deleteComment(commentId);
      if (deleted !== undefined) {
        onCommentCountChange?.(-1);
      }
    } catch (err) {
      console.error('댓글 삭제 실패:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isAuthor = (comment) => {
    if (!user) return false;
    return comment.author?.id === user.id || comment.userId === user.id;
  };

  return (
    <section className="comment-section">
      <h2>댓글</h2>

      <form className="comment-form" onSubmit={handleNewComment}>
        <textarea
          placeholder={isAuthenticated ? '댓글을 입력하세요.' : '댓글을 작성하려면 로그인하세요.'}
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          disabled={!isAuthenticated || isSubmitting}
        />
        <button type="submit" disabled={!isAuthenticated || isSubmitting || !newComment.trim()}>
          등록
        </button>
      </form>

      {error && <p className="comment-error">{error}</p>}

      {isLoading ? (
        <p className="comment-state">댓글을 불러오는 중...</p>
      ) : comments.length === 0 ? (
        <p className="comment-state">댓글이 없습니다.</p>
      ) : (
        <ul className="comment-list">
          {comments.map(comment => (
            <li key={comment.id} className="comment-item">
              <div className="comment-header">
                <span className="comment-author">{comment.author?.name || comment.userName || '익명'}</span>
                <span className="comment-date">{new Date(comment.createdAt).toLocaleString()}</span>
              </div>
              {editingId === comment.id ? (
                <div className="comment-edit">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={3}
                  />
                  <div className="comment-actions">
                    <button type="button" onClick={() => handleEditSubmit(comment.id)} disabled={!editingContent.trim()}>
                      저장
                    </button>
                    <button type="button" onClick={() => setEditingId(null)}>
                      취소
                    </button>
                  </div>
                </div>
              ) : (
                <p className="comment-body">{comment.content}</p>
              )}

              <div className="comment-actions">
                <button type="button" onClick={() => startReply(comment.id)}>
                  답글
                </button>
                <button type="button" onClick={() => handleToggleReplies(comment.id)}>
                  {expandedReplies[comment.id] ? '답글 숨기기' : '답글 보기'}
                </button>
                {isAuthor(comment) && (
                  <>
                    <button type="button" onClick={() => startEdit(comment)}>수정</button>
                    <button type="button" onClick={() => handleDelete(comment.id)}>삭제</button>
                  </>
                )}
              </div>

              {replyingTo === comment.id && (
                <div className="reply-form">
                  <textarea
                    value={replyContent}
                    onChange={(e) => setReplyContent(e.target.value)}
                    rows={2}
                  />
                  <div className="comment-actions">
                    <button type="button" onClick={() => handleReplySubmit(comment.id)} disabled={!replyContent.trim()}>
                      답글 등록
                    </button>
                    <button type="button" onClick={() => setReplyingTo(null)}>취소</button>
                  </div>
                </div>
              )}

              {expandedReplies[comment.id] && (
                <ul className="reply-list">
                  {(repliesMap[comment.id] || []).map(reply => (
                    <li key={reply.id} className="reply-item">
                      <div className="comment-header">
                        <span className="comment-author">{reply.author?.name || reply.userName || '익명'}</span>
                        <span className="comment-date">{new Date(reply.createdAt).toLocaleString()}</span>
                      </div>
                      <p className="comment-body">{reply.content}</p>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default CommentSection;
