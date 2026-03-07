import { useNavigate } from 'react-router-dom';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { usePostForm } from '../hooks/usePostForm';
import { FORM_CONFIG, UPLOAD_CONFIG } from '../config';
import './PostCreate.css';

function PostCreate() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();

  const {
    content,
    visibility,
    previewImages,
    errors,
    isLoading,
    setContent,
    setVisibility,
    handleImageSelect,
    removeImage,
    submitPost,
  } = usePostForm(accessToken);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const success = await submitPost();
      if (success) {
        alert('게시글이 작성되었습니다.');
        navigate('/posts');
      }
    } catch (err) {
      const status = err?.response?.status;
      if (status === 413) {
        alert('이미지 용량이 너무 큽니다. 더 작은 이미지로 다시 시도해주세요.');
      } else if (status === 415) {
        alert('지원하지 않는 이미지 형식입니다. JPG/PNG/WEBP/GIF만 업로드 가능합니다.');
      } else {
        alert('게시글 작성에 실패했습니다. 잠시 후 다시 시도해주세요.');
      }
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageSelect(e.target.files);
      e.target.value = '';
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <GNB />
        <div className="post-create-container">
          <div className="post-create-card">
            <p className="post-create-auth-message">
              게시글을 작성하려면 로그인이 필요합니다.
            </p>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <GNB />
      <div className="post-create-container">
        <div className="post-create-card">
          <h1>새 게시글 작성</h1>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="content">내용</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="무슨 이야기를 나누고 싶으신가요?"
                rows={6}
                maxLength={5000}
                className={errors.content ? 'error' : ''}
              />
              <div className="char-count">
                <span className={content.length > 4500 ? 'warning' : ''}>{content.length}</span>
                / 5000
              </div>
              {errors.content && <p className="error-message">{errors.content}</p>}
            </div>

            <div className="form-group">
              <label htmlFor="visibility">공개 범위</label>
              <select
                id="visibility"
                value={visibility}
                onChange={(e) => setVisibility(e.target.value)}
              >
                {FORM_CONFIG.visibilityOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>이미지 첨부</label>
              <label className="image-upload-button" htmlFor="image-input">
                📷 사진 추가
              </label>
              <input
                id="image-input"
                type="file"
                accept={UPLOAD_CONFIG.allowedImageTypes.join(',')}
                multiple
                onChange={handleFileChange}
                style={{ display: 'none' }}
              />
            </div>

            {previewImages.length > 0 && (
              <div className="image-preview-list">
                {previewImages.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src} alt={`미리보기 ${index + 1}`} />
                    <button
                      type="button"
                      className="image-remove-button"
                      onClick={() => removeImage(index)}
                      aria-label="이미지 제거"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="post-create-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/posts')}
              >
                취소
              </button>
              <button type="submit" className="submit-button" disabled={isLoading}>
                {isLoading ? '작성 중...' : '게시하기'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default PostCreate;
