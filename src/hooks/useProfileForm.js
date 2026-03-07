import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  API_CONFIG,
  UPLOAD_CONFIG,
  FORM_CONFIG,
  VALIDATION_MESSAGES,
} from '../config';

export function useProfileForm(accessToken, onProfileUpdated) {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    firstName: '',
    phoneNumber: '',
    country: FORM_CONFIG.defaultCountry,
    address1: '',
    address2: '',
    birth: '',
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [previewBackground, setPreviewBackground] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [selectedBackgroundFile, setSelectedBackgroundFile] = useState(null);
  const [isProfileImageRemoved, setIsProfileImageRemoved] = useState(false);
  const [isBackgroundImageRemoved, setIsBackgroundImageRemoved] = useState(false);

  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  useEffect(() => {
    const loadProfile = async () => {
      if (!accessToken) {
        setIsLoadingProfile(false);
        return;
      }

      try {
        const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.profile}`;
        const response = await axios.get(url, {
          headers: { Authorization: `Bearer ${accessToken}` },
          withCredentials: true,
        });

        const data = response.data?.data;
        if (data) {
          setPreviewImage(data.profileImage || null);
          setPreviewBackground(data.bgImage || null);
          setSelectedFile(null);
          setSelectedBackgroundFile(null);
          setIsProfileImageRemoved(false);
          setIsBackgroundImageRemoved(false);

          setFormData({
            name: data.name || '',
            lastName: data.lastName || '',
            firstName: data.firstName || '',
            phoneNumber: data.phoneNumber || '',
            country: data.country?.toString() || FORM_CONFIG.defaultCountry,
            address1: data.address1 || '',
            address2: data.address2 || '',
            birth: data.birth ? data.birth.split('T')[0] : '',
          });
        }
      } catch (error) {
        console.error('프로필 조회 실패:', error);
      } finally {
        setIsLoadingProfile(false);
      }
    };

    loadProfile();
  }, [accessToken]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageSelect = (file, type) => {
    if (!file) return false;

    const isValidType = UPLOAD_CONFIG.allowedImageTypes.some(
      (allowedType) => file.type === allowedType || file.type.startsWith('image/')
    );

    if (!isValidType) {
      alert(VALIDATION_MESSAGES.image.invalidType);
      return false;
    }

    const maxSize =
      type === 'profile'
        ? UPLOAD_CONFIG.maxProfileImageSize
        : UPLOAD_CONFIG.maxBackgroundImageSize;

    if (file.size > maxSize) {
      const maxMB = UPLOAD_CONFIG.bytesToMB(maxSize);
      alert(VALIDATION_MESSAGES.image.tooLarge(maxMB));
      return false;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      if (type === 'profile') {
        setSelectedFile(file);
        setPreviewImage(reader.result);
        setIsProfileImageRemoved(false);
      } else {
        setSelectedBackgroundFile(file);
        setPreviewBackground(reader.result);
        setIsBackgroundImageRemoved(false);
      }
    };
    reader.readAsDataURL(file);

    return true;
  };

  const removeImage = (type) => {
    if (type === 'profile') {
      setSelectedFile(null);
      setPreviewImage(null);
      setIsProfileImageRemoved(true);
      return;
    }

    setSelectedBackgroundFile(null);
    setPreviewBackground(null);
    setIsBackgroundImageRemoved(true);
  };

  const uploadImage = async (file) => {
    if (!file) return null;

    const uploadFormData = new FormData();
    uploadFormData.append('file', file);

    try {
      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.uploadImage}`;
      const response = await axios.post(url, uploadFormData, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true,
      });

      return response.data?.data?.imageUrl || null;
    } catch (error) {
      console.error('이미지 업로드 실패:', error);
      return null;
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = VALIDATION_MESSAGES.name.required;
    }

    if (formData.phoneNumber && !/^[\d-]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = VALIDATION_MESSAGES.phoneNumber.invalid;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const submitProfile = async () => {
    if (!validateForm()) return false;

    setIsLoading(true);

    try {
      let profileImageUrl = previewImage;
      let bgImageUrl = previewBackground;

      if (selectedFile) {
        const uploadedUrl = await uploadImage(selectedFile);
        if (uploadedUrl) profileImageUrl = uploadedUrl;
      }

      if (selectedBackgroundFile) {
        const uploadedUrl = await uploadImage(selectedBackgroundFile);
        if (uploadedUrl) bgImageUrl = uploadedUrl;
      }

      if (profileImageUrl?.startsWith('data:')) profileImageUrl = null;
      if (bgImageUrl?.startsWith('data:')) bgImageUrl = null;

      const requestData = {
        name: formData.name,
        // 삭제 의도일 때는 빈 문자열을 보내 null-무시 업데이트를 우회
        profileImage: isProfileImageRemoved ? '' : (profileImageUrl || null),
        lastName: formData.lastName || null,
        firstName: formData.firstName || null,
        phoneNumber: formData.phoneNumber || null,
        country: parseInt(formData.country, 10),
        address1: formData.address1 || null,
        address2: formData.address2 || null,
        birth: formData.birth ? `${formData.birth}T00:00:00` : null,
        bgImage: isBackgroundImageRemoved ? '' : (bgImageUrl || null),
      };

      const profileImageForUi =
        selectedFile && requestData.profileImage
          ? `${requestData.profileImage}${requestData.profileImage.includes('?') ? '&' : '?'}v=${Date.now()}`
          : requestData.profileImage;

      const url = `${API_CONFIG.baseUrl}${API_CONFIG.endpoints.profile}`;
      const response = await axios.put(url, requestData, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        withCredentials: true,
      });

      const isSuccess = response.data?.success || response.status === 200;

      if (isSuccess && typeof onProfileUpdated === 'function') {
        const responseProfile = response.data?.data ?? {};

        onProfileUpdated({
          name: responseProfile.name ?? requestData.name,
          profileImage: responseProfile.profileImage ?? profileImageForUi,
          firstName: responseProfile.firstName ?? requestData.firstName,
          lastName: responseProfile.lastName ?? requestData.lastName,
          phoneNumber: responseProfile.phoneNumber ?? requestData.phoneNumber,
          country: responseProfile.country ?? requestData.country,
          address1: responseProfile.address1 ?? requestData.address1,
          address2: responseProfile.address2 ?? requestData.address2,
          birth: responseProfile.birth ?? requestData.birth,
          bgImage: responseProfile.bgImage ?? requestData.bgImage,
        });
      }

      if (isSuccess) {
        setSelectedFile(null);
        setSelectedBackgroundFile(null);
        setIsProfileImageRemoved(false);
        setIsBackgroundImageRemoved(false);
      }

      return isSuccess;
    } catch (error) {
      console.error('프로필 수정 실패:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  return {
    formData,
    errors,
    isLoading,
    isLoadingProfile,
    previewImage,
    previewBackground,
    handleChange,
    handleImageSelect,
    removeImage,
    validateForm,
    submitProfile,
  };
}
