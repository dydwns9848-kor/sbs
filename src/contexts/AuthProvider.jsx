import { useState, useEffect } from 'react';
import axios from 'axios';
import AuthContext from './AuthContext';

/**
 * AuthProvider 而댄룷?뚰듃
 *
 * ?몄쬆 ?곹깭瑜?愿由ы븯怨??섏쐞 而댄룷?뚰듃?ㅼ뿉寃??몄쬆 ?뺣낫瑜??쒓났?⑸땲??
 *
 * @param {Object} props - 而댄룷?뚰듃 props
 * @param {ReactNode} props.children - ?섏쐞 而댄룷?뚰듃??
 */
export function AuthProvider({ children }) {
  // ?ъ슜???뺣낫瑜???ν븯???곹깭
  // user 媛앹껜: { id, email, name, role }
  const [user, setUser] = useState(null);

  // accessToken????ν븯???곹깭
  // JWT ?좏겙 臾몄옄??
  const [accessToken, setAccessToken] = useState(null);

  // 濡쒕뵫 ?곹깭 (珥덇린 濡쒕뱶 ??localStorage?먯꽌 ?곗씠?곕? 遺덈윭?ㅻ뒗 ?숈븞)
  const [isLoading, setIsLoading] = useState(true);

  const normalizeUserData = (incomingUser, fallbackUser = null) => {
    if (!incomingUser && !fallbackUser) return null;
    const source = incomingUser || fallbackUser || {};
    const fallback = fallbackUser || {};

    const profileImage = source.profileImage
      ?? source.userProfileImage
      ?? source.profileImageUrl
      ?? source.avatar
      ?? source.avatarUrl
      ?? fallback.profileImage
      ?? fallback.userProfileImage
      ?? fallback.profileImageUrl
      ?? fallback.avatar
      ?? null;

    const safeProfileImage = (
      typeof profileImage === 'string'
      && ['null', 'undefined', ''].includes(profileImage.trim().toLowerCase())
    )
      ? null
      : profileImage;

    return {
      ...fallback,
      ...source,
      profileImage: safeProfileImage ?? null,
    };
  };

  /**
   * useEffect: 而댄룷?뚰듃 留덉슫????/refresh API瑜??몄텧?섏뿬 ?몄쬆 ?뺣낫 蹂듭썝
   *
   * 釉뚮씪?곗?瑜??덈줈怨좎묠?대룄 濡쒓렇???곹깭媛 ?좎??섎룄濡?
   * HTTP-only 荑좏궎????λ맂 refreshToken???ъ슜?섏뿬
   * ?쒕쾭濡쒕????덈줈??accessToken??諛쒓툒諛쏆뒿?덈떎.
   *
   * 泥섎━ 怨쇱젙:
   * 1. localStorage???ъ슜???뺣낫媛 ?덈뒗吏 ?뺤씤 (濡쒓렇???대젰 ?뺤씤)
   * 2. ?ъ슜???뺣낫媛 ?덉쑝硫?/api/refresh API ?몄텧 (withCredentials: true濡?荑좏궎 ?ы븿)
   * 3. ?쒕쾭媛 refreshToken 荑좏궎瑜??뺤씤?섍퀬 ?좏슚?섎㈃ ??accessToken 諛쒓툒
   * 4. ?깃났 ???ъ슜???뺣낫? accessToken???곹깭?????
   * 5. ?ㅽ뙣 ??(refreshToken 留뚮즺) localStorage ?뺣━?섍퀬 濡쒓렇?꾩썐 ?곹깭 ?좎?
   * 6. localStorage???ъ슜???뺣낫媛 ?놁쑝硫?API ?몄텧 ?놁씠 濡쒓렇?꾩썐 ?곹깭 ?좎?
   */
  useEffect(() => {
    // async ?⑥닔瑜??뺤쓽?섏뿬 API ?몄텧
    const checkAuth = async () => {
      // ========================================
      // ?뵎 以묒슂: ?대? 濡쒓렇?몃맂 ?곹깭?쇰㈃ refresh ?몄텧 ?앸왂
      // ========================================
      // user? accessToken???대? 硫붾え由ъ뿉 ?덈떎硫?(?? 移댁뭅??濡쒓렇??吏곹썑)
      // /refresh API瑜??몄텧???꾩슂媛 ?놁쓬
      if (user && accessToken) {
        console.log('?대? 濡쒓렇?몃맂 ?곹깭 - /refresh API ?몄텧 ?앸왂');
        setIsLoading(false);
        return;
      }

      // localStorage?먯꽌 ??λ맂 ?ъ슜???뺣낫 ?뺤씤
      const savedUser = localStorage.getItem('user');

      // ?ъ슜???뺣낫媛 ?놁쑝硫?濡쒓렇???대젰???녿뒗 寃껋씠誘濡?API ?몄텧 遺덊븘??
      if (!savedUser) {
        console.log('濡쒓렇???대젰 ?놁쓬 - /refresh API ?몄텧 ?앸왂');
        setIsLoading(false);
        return;
      }

      // ?ъ슜???뺣낫媛 ?덉쑝硫?/refresh API ?몄텧?섏뿬 ?좏겙 媛깆떊 ?쒕룄
      // (?섏씠吏 ?덈줈怨좎묠 ?쒕굹由ъ삤: localStorage?먮뒗 user媛 ?덉?留?硫붾え由ъ뿉???놁쓬)
      try {
        console.log('=== /api/refresh ?몄텧 (?섏씠吏 ?덈줈怨좎묠) ===');
        console.log('localStorage??user:', savedUser);
        console.log('?꾩옱 釉뚮씪?곗? 荑좏궎:', document.cookie);

        // /api/refresh ?붾뱶?ъ씤???몄텧
        // withCredentials: true濡?HTTP-only 荑좏궎(refreshToken) ?ы븿
        const response = await axios.post('/api/refresh', {}, {
          withCredentials: true
        });

        console.log('=== /api/refresh ?묐떟 ?깃났 ===');
        console.log('?묐떟 ?곗씠??', response.data);

        // ?쒕쾭 ?묐떟 ?뺤씤
        if (response.data.success) {
          // ?좏겙 媛깆떊 ?깃났: ?ъ슜???뺣낫? ??accessToken ???
          const token = response.data.data.accessToken;

          // 諛깆뿏?쒓? user ?뺣낫瑜?諛섑솚?섎뒗 寃쎌슦? ???섎뒗 寃쎌슦 紐⑤몢 泥섎━
          let userData = response.data.data.user;

          // 諛깆뿏?쒓? user ?뺣낫瑜?諛섑솚?섏? ?딆쑝硫?localStorage?먯꽌 媛?몄샂
          if (!userData) {
            console.log('諛깆뿏?쒓? user ?뺣낫瑜?諛섑솚?섏? ?딆쓬 - localStorage?먯꽌 蹂듭썝');
            userData = JSON.parse(savedUser);
          }

          console.log('?곹깭 ?낅뜲?댄듃 ??- user:', user);
          console.log('?곹깭 ?낅뜲?댄듃 ??- accessToken:', accessToken);
          console.log('?덈줈 ?ㅼ젙??userData:', userData);
          console.log('?덈줈 ?ㅼ젙??token:', token);

          const normalizedUser = normalizeUserData(userData, user);
          setUser(normalizedUser);
          setAccessToken(token);

          // localStorage?먮뒗 ?ъ슜???뺣낫留????(UX 媛쒖꽑?? accessToken? ??ν븯吏 ?딆쓬)
          localStorage.setItem('user', JSON.stringify(normalizedUser));
          console.log('?좏겙 媛깆떊 ?깃났 - ?곹깭 ?낅뜲?댄듃 ?꾨즺');
        } else {
          // ?좏겙 媛깆떊 ?ㅽ뙣: 濡쒓렇?꾩썐 ?곹깭 ?좎?
          console.log('?좏겙 媛깆떊 ?ㅽ뙣:', response.data.message);
          // localStorage ?뺣━ (留뚮즺???뺣낫 ?쒓굅)
          localStorage.removeItem('user');
        }
      } catch (error) {
        // refreshToken??留뚮즺?섏뿀嫄곕굹 ?좏슚?섏? ?딆? 寃쎌슦
        console.error('=== /api/refresh ?붿껌 ?ㅽ뙣 ===');
        console.error('?먮윭 ?곹깭 肄붾뱶:', error.response?.status);
        console.error('?먮윭 ?묐떟 ?곗씠??', error.response?.data);
        console.error('?먮윭 ?ㅻ뜑:', error.response?.headers);
        console.error('?꾩껜 ?먮윭:', error);

        // localStorage ?뺣━ (留뚮즺???뺣낫 ?쒓굅)
        localStorage.removeItem('user');
      } finally {
        // 濡쒕뵫 ?꾨즺 (?깃났/?ㅽ뙣 愿怨꾩뾾???ㅽ뻾)
        setIsLoading(false);
      }
    };

    // async ?⑥닔 ?ㅽ뻾
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // 鍮?諛곗뿴: 而댄룷?뚰듃 留덉슫??????踰덈쭔 ?ㅽ뻾 (user, accessToken? ?섎룄?곸쑝濡??쒖쇅)

  /**
   * login ?⑥닔
   *
   * 濡쒓렇???깃났 ???몄텧?섎뒗 ?⑥닔?낅땲??
   * ?쒕쾭濡쒕???諛쏆? ?ъ슜???뺣낫? ?좏겙????ν빀?덈떎.
   *
   * @param {Object} userData - ?쒕쾭濡쒕???諛쏆? ?ъ슜???뺣낫
   * @param {string} token - accessToken
   */
  const login = (userData, token) => {
    const normalizedUser = normalizeUserData(userData, user);
    // ?곹깭 ?낅뜲?댄듃
    setUser(normalizedUser);
    setAccessToken(token);

    // localStorage?먮뒗 ?ъ슜???뺣낫留????(UX 媛쒖꽑??
    // accessToken? 蹂댁븞???꾪빐 硫붾え由?state)?먮쭔 ???
    // ?섏씠吏 ?덈줈怨좎묠 ?쒖뿉??/refresh API瑜??듯빐 ???좏겙 諛쒓툒
    localStorage.setItem('user', JSON.stringify(normalizedUser));
  };

  /**
   * logout ?⑥닔
   *
   * 濡쒓렇?꾩썐 ???몄텧?섎뒗 ?⑥닔?낅땲??
   * ?쒕쾭??濡쒓렇?꾩썐 ?붿껌??蹂대궡怨???λ맂 紐⑤뱺 ?몄쬆 ?뺣낫瑜???젣?⑸땲??
   *
   * 泥섎━ 怨쇱젙:
   * 1. 諛깆뿏??/api/logout ?붾뱶?ъ씤???몄텧 (HTTP-only 荑좏궎??refreshToken ??젣)
   * 2. ?꾨줎?몄뿏???곹깭 珥덇린??(user, accessToken)
   * 3. localStorage ?뺣━
   */
  const logout = async () => {
    try {
      // 諛깆뿏?쒖뿉 濡쒓렇?꾩썐 ?붿껌
      // - HTTP-only 荑좏궎??refreshToken????젣?섍린 ?꾪빐 ?쒕쾭 ?몄텧 ?꾩슂
      // - withCredentials: true濡?荑좏궎 ?꾩넚
      await axios.post('/api/logout', {}, {
        withCredentials: true
      });

      console.log('?쒕쾭 濡쒓렇?꾩썐 ?깃났');
    } catch (error) {
      // ?쒕쾭 濡쒓렇?꾩썐 ?ㅽ뙣 ?쒖뿉???대씪?댁뼵???곹깭???뺣━
      console.error('?쒕쾭 濡쒓렇?꾩썐 ?ㅽ뙣:', error);
      console.log('?대씪?댁뼵???곹깭留??뺣━?⑸땲??');
    } finally {
      // ?쒕쾭 ?묐떟 ?깃났/?ㅽ뙣 愿怨꾩뾾???대씪?댁뼵???곹깭 ?뺣━
      // (?ㅽ듃?뚰겕 ?ㅻ쪟???쒕쾭 ?먮윭媛 ?덉뼱???ъ슜?먮뒗 濡쒓렇?꾩썐??寃껋쿂??蹂댁뿬????

      // ?곹깭 珥덇린??
      setUser(null);
      setAccessToken(null);

      // localStorage ?뺣━ (?ъ슜???뺣낫留??쒓굅)
      localStorage.removeItem('user');

      console.log('?대씪?댁뼵??濡쒓렇?꾩썐 ?꾨즺');
    }
  };

  /**
   * updateToken ?⑥닔
   *
   * accessToken??媛깆떊?섎뒗 ?⑥닔?낅땲??
   * ?좏겙 媛깆떊 API ?몄텧 ???덈줈???좏겙????ν븷 ???ъ슜?⑸땲??
   *
   * @param {string} newToken - ?덈줈??accessToken
   */
  const updateToken = (newToken) => {
    // accessToken은 메모리(state)에만 저장
    setAccessToken(newToken);
  };

  /**
   * updateUser 함수
   *
   * 사용자 정보를 부분 또는 전체 업데이트합니다.
   */
  const updateUser = (updater) => {
    setUser((prevUser) => {
      const nextUser =
        typeof updater === 'function' ? updater(prevUser) : updater;
      const normalizedUser = normalizeUserData(nextUser, prevUser);

      if (normalizedUser) {
        localStorage.setItem('user', JSON.stringify(normalizedUser));
      } else {
        localStorage.removeItem('user');
      }

      return normalizedUser;
    });
  };

  /**
   * refreshAccessToken ?⑥닔
   *
   * HTTP-only 荑좏궎????λ맂 Refresh Token???ъ슜?섏뿬
   * ?덈줈??Access Token??諛쒓툒諛쏅뒗 ?⑥닔?낅땲??
   *
   * @returns {Promise<string>} - ?덈줈??accessToken
   * @throws {Error} - ?좏겙 媛깆떊 ?ㅽ뙣 ???먮윭 諛쒖깮
   *
   * ?ъ슜 ?쒕굹由ъ삤:
   * 1. 移댁뭅???뚯뀥 濡쒓렇??肄쒕갚 泥섎━ ??
   * 2. Access Token 留뚮즺 ???먮룞 媛깆떊
   * 3. ?섏씠吏 ?덈줈怨좎묠 ???몄쬆 ?뺣낫 蹂듭썝
   */
  const refreshAccessToken = async () => {
    try {
      // ?붾쾭源? ?꾩옱 荑좏궎 ?뺤씤
      console.log('=== /api/refresh ?몄텧 ?쒖옉 ===');
      console.log('?꾩옱 荑좏궎:', document.cookie);
      console.log('withCredentials: true');

      // /api/refresh ?붾뱶?ъ씤???몄텧
      // withCredentials: true濡?HTTP-only 荑좏궎(refreshToken)瑜??먮룞?쇰줈 ?꾩넚
      // ?붿껌 諛붾뵒??鍮?媛앹껜 {} (?쇰? 諛깆뿏?쒕뒗 null??諛쏆? ?딆쓣 ???덉쓬)
      const response = await axios.post('/api/refresh', {}, {
        withCredentials: true,
        headers: { 'Content-Type': 'application/json' }
      });

      console.log('=== /api/refresh ?묐떟 ?깃났 ===');
      console.log('?묐떟 ?곗씠??', response.data);

      // ?쒕쾭 ?묐떟 ?뺤씤
      if (response.data.success) {
        // ?좏겙 媛깆떊 ?깃났: ?ъ슜???뺣낫? ??accessToken ???
        // response.data.data 援ъ“: { accessToken, user: { id, email, name, role } }
        const newAccessToken = response.data.data.accessToken;
        const userData = response.data.data.user;
        const normalizedUser = normalizeUserData(userData, user);

        // ?곹깭 ?낅뜲?댄듃
        setUser(normalizedUser);
        setAccessToken(newAccessToken);

        // localStorage?먮뒗 ?ъ슜???뺣낫留????(UX 媛쒖꽑??
        localStorage.setItem('user', JSON.stringify(normalizedUser));

        console.log('Access Token 媛깆떊 ?깃났');

        // ?덈줈??accessToken 諛섑솚
        return newAccessToken;
      } else {
        // ?좏겙 媛깆떊 ?ㅽ뙣: ?먮윭 throw
        throw new Error(response.data.message || '?좏겙 媛깆떊???ㅽ뙣?덉뒿?덈떎.');
      }
    } catch (error) {
      // Refresh Token??留뚮즺??寃쎌슦 濡쒓렇?꾩썐 泥섎━
      console.error('=== /api/refresh ?붿껌 ?ㅽ뙣 ===');
      console.error('?먮윭 ?곹깭 肄붾뱶:', error.response?.status);
      console.error('?먮윭 硫붿떆吏:', error.response?.data);
      console.error('?먮윭 ?ㅻ뜑:', error.response?.headers);
      console.error('?꾩껜 ?먮윭:', error);

      // ?곹깭 珥덇린??
      setUser(null);
      setAccessToken(null);

      // localStorage ?뺣━
      localStorage.removeItem('user');

      // ?먮윭瑜?throw?섏뿬 ?몄텧??履쎌뿉??泥섎━?????덈룄濡???
      throw error;
    }
  };

  // Context???쒓났??媛?
  // ?섏쐞 而댄룷?뚰듃?ㅼ? ??媛믩뱾??useAuth() ?낆쓣 ?듯빐 ?ъ슜?????덉뒿?덈떎.
  const value = {
    user,                // ?꾩옱 濡쒓렇?명븳 ?ъ슜???뺣낫
    accessToken,         // ?꾩옱 accessToken
    isLoading,           // 濡쒕뵫 ?곹깭
    login,               // 濡쒓렇???⑥닔
    logout,              // 濡쒓렇?꾩썐 ?⑥닔
    updateToken,         // 토큰 갱신 함수
    updateUser,          // 사용자 정보 갱신 함수
    refreshAccessToken,  // Refresh Token?쇰줈 Access Token 媛깆떊 ?⑥닔
    isAuthenticated: !!user  // 濡쒓렇???щ? (user媛 ?덉쑝硫?true)
  };

  /**
   * AuthContext.Provider瑜??ъ슜?섏뿬 ?몄쬆 ?뺣낫瑜??섏쐞 而댄룷?뚰듃???쒓났
   *
   * Context API???숈옉 ?먮━:
   * 1. Provider 而댄룷?뚰듃媛 value prop???듯빐 ?곗씠?곕? ?쒓났
   * 2. ?섏쐞 而댄룷?뚰듃?먯꽌 useAuth() ?낆쓣 ?ъ슜?섏뿬 ???곗씠?곗뿉 ?묎렐
   * 3. value媛 蹂寃쎈릺硫??대? ?ъ슜?섎뒗 紐⑤뱺 而댄룷?뚰듃媛 ?먮룞?쇰줈 由щ젋?붾쭅
   *
   * ?덉떆:
   * - App.jsx?먯꽌 <AuthProvider>濡??꾩껜 ?깆쓣 媛먯뙂
   * - Login.jsx?먯꽌 useAuth()瑜??몄텧?섎㈃ ?ш린???쒓났?섎뒗 value瑜?諛쏆쓬
   * - login() ?⑥닔瑜??몄텧?섎㈃ user, accessToken ?곹깭媛 蹂寃쎈맖
   * - ??蹂寃쎌궗??씠 ?먮룞?쇰줈 Gnb.jsx ??紐⑤뱺 ?섏쐞 而댄룷?뚰듃??諛섏쁺??
   *
   * {children}:
   * - AuthProvider濡?媛먯떬 紐⑤뱺 ?섏쐞 而댄룷?뚰듃瑜??섎?
   * - App.jsx?먯꽌??<BrowserRouter>, <Routes> ?깆씠 children???대떦
   * - ??children?ㅼ씠 紐⑤몢 ?몄쬆 ?뺣낫???묎렐?????덇쾶 ??
   */
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

