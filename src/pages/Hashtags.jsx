import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import GNB from '../components/Gnb';
import Footer from '../components/Footer';
import { useAuth } from '../hooks/useAuth';
import { useHashtags } from '../hooks/useHashtags';
import { formatHashtag, normalizeHashtagName } from '../utils/hashtag';
import './Hashtags.css';

const PAGE_SIZE = 10;

function Hashtags() {
  const navigate = useNavigate();
  const { accessToken } = useAuth();
  const { getTrendingHashtags, getTopTrendingHashtags, searchHashtags } = useHashtags(accessToken);

  const [trendingData, setTrendingData] = useState({ content: [], totalPages: 0, number: 0 });
  const [topHashtags, setTopHashtags] = useState([]);
  const [trendingPage, setTrendingPage] = useState(0);
  const [isTrendingLoading, setIsTrendingLoading] = useState(true);
  const [trendingError, setTrendingError] = useState(null);

  const [keyword, setKeyword] = useState('');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchData, setSearchData] = useState({ content: [], totalPages: 0, number: 0 });
  const [searchPage, setSearchPage] = useState(0);
  const [isSearchLoading, setIsSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState(null);

  useEffect(() => {
    const fetchTrending = async () => {
      setIsTrendingLoading(true);
      setTrendingError(null);
      try {
        const [trending, top] = await Promise.all([
          getTrendingHashtags(trendingPage, PAGE_SIZE),
          getTopTrendingHashtags(10),
        ]);
        setTrendingData({
          content: Array.isArray(trending?.content) ? trending.content : [],
          totalPages: Number(trending?.totalPages || 0),
          number: Number(trending?.number || trendingPage),
        });
        setTopHashtags(Array.isArray(top) ? top : []);
      } catch (err) {
        setTrendingData({ content: [], totalPages: 0, number: trendingPage });
        setTopHashtags([]);
        setTrendingError('인기 해시태그를 불러오지 못했습니다.');
      } finally {
        setIsTrendingLoading(false);
      }
    };

    fetchTrending();
  }, [getTopTrendingHashtags, getTrendingHashtags, trendingPage]);

  useEffect(() => {
    if (!searchKeyword) return;

    const fetchSearch = async () => {
      setIsSearchLoading(true);
      setSearchError(null);
      try {
        const result = await searchHashtags(searchKeyword, searchPage, PAGE_SIZE);
        setSearchData({
          content: Array.isArray(result?.content) ? result.content : [],
          totalPages: Number(result?.totalPages || 0),
          number: Number(result?.number || searchPage),
        });
      } catch (err) {
        setSearchData({ content: [], totalPages: 0, number: searchPage });
        setSearchError('해시태그 검색에 실패했습니다.');
      } finally {
        setIsSearchLoading(false);
      }
    };

    fetchSearch();
  }, [searchHashtags, searchKeyword, searchPage]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    const nextKeyword = normalizeHashtagName(keyword);
    if (!nextKeyword) return;
    setSearchPage(0);
    setSearchKeyword(nextKeyword);
  };

  const moveToHashtag = (name) => {
    const normalized = normalizeHashtagName(name);
    if (!normalized) return;
    navigate(`/hashtags/${encodeURIComponent(normalized)}`);
  };

  return (
    <>
      <GNB />
      <main className="hashtags-container">
        <section className="hashtags-panel">
          <header className="hashtags-header">
            <div>
              <h1>해시태그</h1>
              <p>인기 해시태그를 확인하고 게시글을 탐색해보세요.</p>
            </div>
          </header>

          <div className="hashtags-top-list">
            {topHashtags.map((tag, index) => (
              <button
                type="button"
                key={`${tag.id || tag.name || index}-${index}`}
                className="hashtags-top-chip"
                onClick={() => moveToHashtag(tag.name || tag.hashtag)}
              >
                <span>{index + 1}</span>
                <strong>{formatHashtag(tag.name || tag.hashtag)}</strong>
              </button>
            ))}
          </div>

          <form className="hashtags-search" onSubmit={handleSearchSubmit}>
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="해시태그 검색 (예: 맛집)"
            />
            <button type="submit">검색</button>
          </form>
        </section>

        <section className="hashtags-panel">
          <h2>인기 해시태그</h2>
          {isTrendingLoading ? (
            <p className="hashtags-state">불러오는 중...</p>
          ) : trendingError ? (
            <p className="hashtags-state">{trendingError}</p>
          ) : trendingData.content.length === 0 ? (
            <p className="hashtags-state">표시할 해시태그가 없습니다.</p>
          ) : (
            <ul className="hashtags-list">
              {trendingData.content.map((tag, index) => {
                const rank = trendingPage * PAGE_SIZE + index + 1;
                const normalized = normalizeHashtagName(tag.name || tag.hashtag);
                return (
                  <li key={tag.id || `${normalized}-${index}`}>
                    <Link to={`/hashtags/${encodeURIComponent(normalized)}`} className="hashtags-list-link">
                      <span className="hashtags-rank">{rank}</span>
                      <span className="hashtags-name">{formatHashtag(normalized)}</span>
                      <span className="hashtags-count">게시글 {tag.postCount || 0}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
          <div className="hashtags-pagination">
            <button
              type="button"
              onClick={() => setTrendingPage((prev) => Math.max(0, prev - 1))}
              disabled={trendingPage === 0}
            >
              이전
            </button>
            <span>
              {trendingPage + 1} / {Math.max(1, trendingData.totalPages || 1)}
            </span>
            <button
              type="button"
              onClick={() => setTrendingPage((prev) => prev + 1)}
              disabled={trendingData.totalPages > 0 && trendingPage >= trendingData.totalPages - 1}
            >
              다음
            </button>
          </div>
        </section>

        <section className="hashtags-panel">
          <h2>검색 결과 {searchKeyword ? `(${formatHashtag(searchKeyword)})` : ''}</h2>
          {!searchKeyword ? (
            <p className="hashtags-state">검색어를 입력해 해시태그를 찾아보세요.</p>
          ) : isSearchLoading ? (
            <p className="hashtags-state">검색 중...</p>
          ) : searchError ? (
            <p className="hashtags-state">{searchError}</p>
          ) : searchData.content.length === 0 ? (
            <p className="hashtags-state">검색 결과가 없습니다.</p>
          ) : (
            <ul className="hashtags-list">
              {searchData.content.map((tag, index) => {
                const normalized = normalizeHashtagName(tag.name || tag.hashtag);
                return (
                  <li key={tag.id || `${normalized}-${index}`}>
                    <Link to={`/hashtags/${encodeURIComponent(normalized)}`} className="hashtags-list-link">
                      <span className="hashtags-name">{formatHashtag(normalized)}</span>
                      <span className="hashtags-count">게시글 {tag.postCount || 0}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}

          {searchKeyword && (
            <div className="hashtags-pagination">
              <button
                type="button"
                onClick={() => setSearchPage((prev) => Math.max(0, prev - 1))}
                disabled={searchPage === 0}
              >
                이전
              </button>
              <span>
                {searchPage + 1} / {Math.max(1, searchData.totalPages || 1)}
              </span>
              <button
                type="button"
                onClick={() => setSearchPage((prev) => prev + 1)}
                disabled={searchData.totalPages > 0 && searchPage >= searchData.totalPages - 1}
              >
                다음
              </button>
            </div>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}

export default Hashtags;
