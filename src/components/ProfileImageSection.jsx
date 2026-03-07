import { useRef } from 'react';

/**
 * 프로필 이미지 섹션
 *
 * @param {Object} props
 * @param {string|null} props.previewImage
 * @param {string|null} props.previewBackground
 * @param {(file: File, type: 'profile'|'background') => void} props.onImageSelect
 * @param {(type: 'profile'|'background') => void} props.onRemoveImage
 */
function ProfileImageSection({ previewImage, previewBackground, onImageSelect, onRemoveImage }) {
  const profileInputRef = useRef(null);
  const backgroundInputRef = useRef(null);

  const openProfileDialog = () => profileInputRef.current?.click();
  const openBackgroundDialog = () => backgroundInputRef.current?.click();

  const handleFileChange = (e, type) => {
    const file = e.target.files?.[0];
    if (file) {
      onImageSelect(file, type);
    }

    // 같은 파일을 다시 선택해도 change 이벤트가 발생하도록 초기화
    e.target.value = '';
  };

  const handleRemoveClick = (e, type) => {
    e.preventDefault();
    e.stopPropagation();
    onRemoveImage(type);
  };

  return (
    <>
      <div className="profile-header-section">
        <div
          className="profile-background-wrapper"
          onClick={openBackgroundDialog}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => e.key === 'Enter' && openBackgroundDialog()}
          style={{ backgroundImage: previewBackground ? `url(${previewBackground})` : 'none' }}
        >
          {!previewBackground && (
            <div className="background-placeholder">
              <span className="background-placeholder-icon">IMG</span>
              <span className="background-placeholder-text">배경 이미지 선택</span>
            </div>
          )}

          <div className="profile-background-overlay">
            <span>배경 변경</span>
          </div>

          {previewBackground && (
            <button
              type="button"
              className="image-remove-btn background-remove-btn"
              onClick={(e) => handleRemoveClick(e, 'background')}
            >
              배경 삭제
            </button>
          )}
        </div>

        <input
          type="file"
          ref={backgroundInputRef}
          onChange={(e) => handleFileChange(e, 'background')}
          accept="image/*"
          style={{ display: 'none' }}
        />

        <div className="profile-image-container">
          <div
            className="profile-image-wrapper"
            onClick={openProfileDialog}
            role="button"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && openProfileDialog()}
          >
            {previewImage ? (
              <img src={previewImage} alt="프로필 이미지" className="profile-image" />
            ) : (
              <div className="profile-image-placeholder">
                <span className="placeholder-icon">IMG</span>
                <span className="placeholder-text">이미지 선택</span>
              </div>
            )}

            <div className="profile-image-overlay">
              <span>변경</span>
            </div>
          </div>

          {previewImage && (
            <button
              type="button"
              className="image-remove-btn profile-remove-btn"
              onClick={(e) => handleRemoveClick(e, 'profile')}
            >
              프로필 삭제
            </button>
          )}

          <input
            type="file"
            ref={profileInputRef}
            onChange={(e) => handleFileChange(e, 'profile')}
            accept="image/*"
            style={{ display: 'none' }}
          />
        </div>
      </div>

      <p className="image-hint">이미지를 클릭하면 변경, 삭제 버튼으로 기본 이미지로 되돌릴 수 있어요.</p>
    </>
  );
}

export default ProfileImageSection;
