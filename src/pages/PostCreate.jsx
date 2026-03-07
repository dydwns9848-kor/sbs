import { useNavigate } from 'react-router-dom';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { usePostForm } from '../hooks/usePostForm';
import { FORM_CONFIG, UPLOAD_CONFIG } from '../config';
import './PostCreate.css';

/**
 * PostCreate 而댄룷?뚰듃
 *
 * 寃뚯떆湲 ?묒꽦 ?섏씠吏?낅땲??
 * - 寃뚯떆湲 ?댁슜 ?낅젰 (textarea)
 * - 怨듦컻 踰붿쐞 ?좏깮 (PUBLIC, PRIVATE, FOLLOWERS)
 * - ?대?吏 泥⑤? (?ㅼ쨷 ?좏깮 媛??
 * - ?대?吏 誘몃━蹂닿린 諛?媛쒕퀎 ??젣
 */
function PostCreate() {
  const navigate = useNavigate();
  const { accessToken, isAuthenticated } = useAuth();

  // 寃뚯떆湲 ?묒꽦 ??而ㅼ뒪? ??
  const {
    content,
    visibility,
    selectedImages,
    previewImages,
    errors,
    isLoading,
    setContent,
    setVisibility,
    handleImageSelect,
    removeImage,
    submitPost,
  } = usePostForm(accessToken);

  /**
   * ???쒖텧 ?몃뱾??
   * 寃뚯떆湲 ?묒꽦 API ?몄텧 ???깃났?섎㈃ 紐⑸줉 ?섏씠吏濡??대룞?⑸땲??
   */
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

  /**
   * ?대?吏 ?뚯씪 ?좏깮 ?몃뱾??
   * input[type=file]??onChange ?대깽?몄뿉???몄텧?⑸땲??
   */
  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleImageSelect(e.target.files);
      // 媛숈? ?뚯씪???ㅼ떆 ?좏깮?????덈룄濡?input 媛?珥덇린??
      e.target.value = '';
    }
  };

  // 濡쒓렇?명븯吏 ?딆? ?ъ슜?먮뒗 ?묎렐 遺덇?
  if (!isAuthenticated) {
    return (
      <>
        <GNB />
        <div className="post-create-container">
          <div className="post-create-card">
            <p className="post-create-auth-message">
              寃뚯떆湲???묒꽦?섎젮硫?濡쒓렇?몄씠 ?꾩슂?⑸땲??
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
          <h1>??寃뚯떆湲 ?묒꽦</h1>

          <form onSubmit={handleSubmit}>
            {/* 寃뚯떆湲 ?댁슜 ?낅젰 */}
            <div className="form-group">
              <label htmlFor="content">?댁슜</label>
              <textarea
                id="content"
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="臾댁뒯 ?댁빞湲곕? ?섎늻怨??띠쑝?좉???"
                rows={6}
                maxLength={5000}
                className={errors.content ? 'error' : ''}
              />
              {/* 湲?????쒖떆 */}
              <div className="char-count">
                <span className={content.length > 4500 ? 'warning' : ''}>
                  {content.length}
                </span>
                / 5000
              </div>
              {/* ?좏슚???먮윭 硫붿떆吏 */}
              {errors.content && (
                <p className="error-message">{errors.content}</p>
              )}
            </div>

            {/* 怨듦컻 踰붿쐞 ?좏깮 */}
            <div className="form-group">
              <label htmlFor="visibility">怨듦컻 踰붿쐞</label>
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

            {/* ?대?吏 泥⑤? */}
            <div className="form-group">
              <label>?대?吏 泥⑤?</label>
              <label className="image-upload-button" htmlFor="image-input">
                ?벜 ?ъ쭊 異붽?
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

            {/* ?대?吏 誘몃━蹂닿린 紐⑸줉 */}
            {previewImages.length > 0 && (
              <div className="image-preview-list">
                {previewImages.map((src, index) => (
                  <div key={index} className="image-preview-item">
                    <img src={src} alt={`誘몃━蹂닿린 ${index + 1}`} />
                    {/* ?대?吏 ?쒓굅 踰꾪듉 */}
                    <button
                      type="button"
                      className="image-remove-button"
                      onClick={() => removeImage(index)}
                    >
                      ??
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* ?섎떒 踰꾪듉 ?곸뿭 */}
            <div className="post-create-actions">
              <button
                type="button"
                className="cancel-button"
                onClick={() => navigate('/posts')}
              >
                痍⑥냼
              </button>
              <button
                type="submit"
                className="submit-button"
                disabled={isLoading}
              >
                {isLoading ? '?묒꽦 以?..' : '寃뚯떆?섍린'}
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

