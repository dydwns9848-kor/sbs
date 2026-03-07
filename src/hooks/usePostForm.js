import { useState } from 'react';
import axios from 'axios';
import { API_CONFIG, UPLOAD_CONFIG } from '../config';

export function usePostForm(accessToken) {
  const [content, setContent] = useState('');
  const [visibility, setVisibility] = useState('PUBLIC');
  const [selectedImages, setSelectedImages] = useState([]);
  const [previewImages, setPreviewImages] = useState([]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleImageSelect = (files) => {
    const fileArray = Array.from(files);
    const allowedTypes = new Set(
      UPLOAD_CONFIG.allowedImageTypes.map((type) => type.toLowerCase())
    );

    for (const file of fileArray) {
      const fileType = (file.type || '').toLowerCase();

      if (fileType === 'image/heic' || fileType === 'image/heif') {
        alert('HEIC/HEIF 이미지는 지원되지 않습니다. JPG 또는 PNG로 선택해주세요.');
        return;
      }

      if (!allowedTypes.has(fileType)) {
        const allowed = UPLOAD_CONFIG.allowedImageTypes.join(', ');
        alert(`지원하지 않는 이미지 형식입니다.\n허용 형식: ${allowed}`);
        return;
      }

      if (file.size > UPLOAD_CONFIG.maxBackgroundImageSize) {
        const maxMB = UPLOAD_CONFIG.bytesToMB(UPLOAD_CONFIG.maxBackgroundImageSize);
        alert(`파일 크기는 ${maxMB}MB 이하만 업로드 가능합니다.`);
        return;
      }
    }

    setSelectedImages((prev) => [...prev, ...fileArray]);

    fileArray.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImages((prev) => [...prev, reader.result]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setSelectedImages((prev) => prev.filter((_, i) => i !== index));
    setPreviewImages((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!content.trim()) {
      newErrors.content = '게시글 내용을 입력해주세요.';
    }

    if (content.length > 5000) {
      newErrors.content = '게시글은 5000자 이내로 입력해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitPost = async () => {
    if (!validateForm()) return false;

    setIsLoading(true);

    try {
      let response;

      if (selectedImages.length > 0) {
        const formData = new FormData();
        const postData = JSON.stringify({ content, visibility });
        formData.append('post', new Blob([postData], { type: 'application/json' }));

        selectedImages.forEach((file) => {
          formData.append('images', file);
        });

        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.postsWithImages}`;
        response = await axios.post(url, formData, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });
      } else {
        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.posts}`;
        response = await axios.post(
          url,
          { content, visibility },
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
            withCredentials: true,
          }
        );
      }

      return response.data?.success || response.status === 200 || response.status === 201;
    } catch (err) {
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  return {
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
  };
}
