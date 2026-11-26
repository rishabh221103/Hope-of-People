import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  Search,
  Heart,
  Film,
  Radio,
  MessagesSquare,
  Briefcase,
  ArrowRight,
  Sparkles,
  Loader2,
  X,
  Clock,
  Eye,
  ThumbsUp,
  Tag,
  SlidersHorizontal,
} from 'lucide-react';
import { searchService, GlobalSearchData, SearchResultItem, SearchResultType } from '../services/searchService';

type FilterType = 'ALL' | 'CAUSE' | 'REEL' | 'PODCAST' | 'FORUM_POST' | 'BUSINESS';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  const queryParam = searchParams.get('q') || '';
  const typeParam = (searchParams.get('type') as FilterType) || 'ALL';

  const [searchInput, setSearchInput] = useState(queryParam);
  const [activeType, setActiveType] = useState<FilterType>(typeParam);
  const [searchData, setSearchData] = useState<GlobalSearchData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if URL changes externally
  useEffect(() => {
    setSearchInput(queryParam);
    setActiveType(typeParam);
  }, [queryParam, typeParam]);

  // Execute search when query or type changes
  useEffect(() => {
    if (!queryParam.trim()) {
      setSearchData(null);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    searchService
      .search(queryParam.trim(), activeType === 'ALL' ? undefined : activeType)
      .then((data) => {
        if (isMounted) {
          setSearchData(data);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.error('Failed to execute search:', err);
          setError('Failed to fetch search results. Please try again.');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [queryParam, activeType]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchInput.trim()) return;
    setSearchParams({ q: searchInput.trim(), type: activeType });
  };

  const handleTabChange = (type: FilterType) => {
    setActiveType(type);
    if (queryParam.trim()) {
      setSearchParams({ q: queryParam.trim(), type });
    }
  };

  const clearSearch = () => {
    setSearchInput('');
    setSearchParams({});
  };

  // Determine which list to display
  const getDisplayedResults = (): SearchResultItem[] => {
    if (!searchData) return [];
    switch (activeType) {
      case 'CAUSE':
        return searchData.causes;
      case 'REEL':
        return searchData.reels;
      case 'PODCAST':
        return searchData.podcasts;
      case 'FORUM_POST':
        return searchData.forumPosts;
      case 'BUSINESS':
        return searchData.businesses;
      case 'ALL':
      default:
        return searchData.allResults;
    }
  };

  const displayedResults = getDisplayedResults();

  const getBadgeConfig = (type: SearchResultType) => {
    switch (type) {
      case 'CAUSE':
        return {
          label: 'Aid Cause',
          bg: '#ecfdf5',
          color: '#059669',
          border: '#a7f3d0',
          icon: <Heart size={14} />,
          actionText: 'Support Cause',
        };
      case 'REEL':
        return {
          label: 'Impact Reel',
          bg: '#fff1f2',
          color: '#e11d48',
          border: '#fecdd3',
          icon: <Film size={14} />,
          actionText: 'Watch Reel',
        };
      case 'PODCAST':
        return {
          label: 'HOP Podcast',
          bg: '#eef2ff',
          color: '#4f46e5',
          border: '#c7d2fe',
          icon: <Radio size={14} />,
          actionText: 'Listen Now',
        };
      case 'FORUM_POST':
        return {
          label: 'Community Forum',
          bg: '#f0f9ff',
          color: '#0284c7',
          border: '#bae6fd',
          icon: <MessagesSquare size={14} />,
          actionText: 'View Discussion',
        };
      case 'BUSINESS':
        return {
          label: 'Partner Business',
          bg: '#eff6ff',
          color: '#2563eb',
          border: '#bfdbfe',
          icon: <Briefcase size={14} />,
          actionText: 'View Partner',
        };
    }
  };

  return (
    <div style={{ backgroundColor: '#f8fafc', minHeight: 'calc(100vh - 70px)', padding: '2rem 1rem 4rem' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        {/* Header / Search Hero */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.35rem 0.85rem',
            backgroundColor: '#eff6ff',
            color: '#2563eb',
            borderRadius: '9999px',
            fontSize: '0.8rem',
            fontWeight: 700,
            marginBottom: '0.75rem',
          }}>
            <Sparkles size={14} />
            Global Unified Discovery
          </div>
          <h1 style={{ fontSize: '2.25rem', fontWeight: 800, color: '#0f172a', margin: '0 0 0.5rem', letterSpacing: '-0.03em' }}>
            Search Across HOP
          </h1>
          <p style={{ color: '#64748b', fontSize: '1rem', maxWidth: '580px', margin: '0 auto 1.5rem' }}>
            Find medical & education aid causes, impact reels, recovery podcasts, community forum discussions, and partner businesses all in one place.
          </p>

          {/* Search Input Box */}
          <form onSubmit={handleSearchSubmit} style={{ maxWidth: '640px', margin: '0 auto', position: 'relative' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#ffffff',
              borderRadius: '9999px',
              border: '2px solid #e2e8f0',
              boxShadow: '0 8px 24px -4px rgba(15, 23, 42, 0.08)',
              padding: '0.4rem 0.5rem 0.4rem 1.25rem',
              transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
            }}>
              <Search size={20} color="#94a3b8" style={{ marginRight: '0.75rem', flexShrink: 0 }} />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search causes, reels, podcasts, discussions, businesses..."
                style={{
                  border: 'none',
                  outline: 'none',
                  fontSize: '1rem',
                  color: '#0f172a',
                  width: '100%',
                  backgroundColor: 'transparent',
                }}
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={clearSearch}
                  style={{
                    border: 'none',
                    background: 'transparent',
                    cursor: 'pointer',
                    color: '#94a3b8',
                    padding: '0.4rem',
                    marginRight: '0.25rem',
                    display: 'flex',
                  }}
                  title="Clear search"
                >
                  <X size={18} />
                </button>
              )}
              <button
                type="submit"
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  borderRadius: '9999px',
                  padding: '0.65rem 1.4rem',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'background-color 0.15s ease',
                  flexShrink: 0,
                }}
              >
                Search
              </button>
            </div>
          </form>
        </div>

        {/* Filter Category Tabs */}
        {queryParam.trim() && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            overflowX: 'auto',
            paddingBottom: '0.75rem',
            marginBottom: '1.5rem',
            borderBottom: '1px solid #e2e8f0',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.85rem', fontWeight: 600, marginRight: '0.5rem' }}>
              <SlidersHorizontal size={15} />
              Filter:
            </div>

            {[
              { type: 'ALL' as FilterType, label: 'All Results', count: searchData?.totalCount },
              { type: 'CAUSE' as FilterType, label: 'Causes & Aid', count: searchData?.causes?.length },
              { type: 'REEL' as FilterType, label: 'Reels', count: searchData?.reels?.length },
              { type: 'PODCAST' as FilterType, label: 'Podcasts', count: searchData?.podcasts?.length },
              { type: 'FORUM_POST' as FilterType, label: 'Community Forum', count: searchData?.forumPosts?.length },
              { type: 'BUSINESS' as FilterType, label: 'Businesses', count: searchData?.businesses?.length },
            ].map((tab) => {
              const isSelected = activeType === tab.type;
              return (
                <button
                  key={tab.type}
                  onClick={() => handleTabChange(tab.type)}
                  style={{
                    backgroundColor: isSelected ? '#2563eb' : '#ffffff',
                    color: isSelected ? '#ffffff' : '#475569',
                    border: isSelected ? '1px solid #2563eb' : '1px solid #e2e8f0',
                    padding: '0.45rem 0.9rem',
                    borderRadius: '9999px',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.45rem',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <span>{tab.label}</span>
                  {tab.count !== undefined && (
                    <span style={{
                      backgroundColor: isSelected ? 'rgba(255, 255, 255, 0.25)' : '#f1f5f9',
                      color: isSelected ? '#ffffff' : '#64748b',
                      fontSize: '0.72rem',
                      fontWeight: 700,
                      padding: '0.1rem 0.45rem',
                      borderRadius: '9999px',
                    }}>
                      {tab.count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={36} color="#2563eb" className="animate-spin" style={{ margin: '0 auto 1rem' }} />
            <p style={{ color: '#64748b', fontWeight: 500 }}>Searching across causes, reels, podcasts, and community discussions...</p>
          </div>
        )}

        {/* Error State */}
        {!loading && error && (
          <div style={{
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '0.75rem',
            padding: '1.25rem',
            textAlign: 'center',
            color: '#dc2626',
            marginBottom: '2rem',
          }}>
            {error}
          </div>
        )}

        {/* Empty Query State (Initial Visit) */}
        {!queryParam.trim() && !loading && (
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '1rem',
            border: '1px solid #e2e8f0',
            padding: '3rem 2rem',
            textAlign: 'center',
            boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
          }}>
            <div style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              backgroundColor: '#eff6ff',
              color: '#2563eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.25rem',
            }}>
              <Search size={30} />
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
              Explore Everything on HOP
            </h3>
            <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
              Type any keyword above to discover humanitarian aid campaigns, inspiring recovery videos, podcast episodes, community forums, or verified local businesses.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              <span style={{ fontSize: '0.85rem', color: '#94a3b8', alignSelf: 'center' }}>Try popular searches:</span>
              {['Medical', 'Education', 'Wheelchair', 'Recovery', 'Disaster Relief', 'Prosthetics'].map((term) => (
                <button
                  key={term}
                  onClick={() => setSearchParams({ q: term, type: activeType })}
                  style={{
                    backgroundColor: '#f8fafc',
                    border: '1px solid #e2e8f0',
                    color: '#334155',
                    padding: '0.35rem 0.75rem',
                    borderRadius: '9999px',
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {term}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Results List */}
        {!loading && queryParam.trim() && (
          <div>
            {displayedResults.length === 0 ? (
              /* No Results Found State */
              <div style={{
                backgroundColor: '#ffffff',
                borderRadius: '1rem',
                border: '1px solid #e2e8f0',
                padding: '3.5rem 2rem',
                textAlign: 'center',
                boxShadow: '0 4px 12px rgba(15, 23, 42, 0.03)',
              }}>
                <div style={{
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  backgroundColor: '#f1f5f9',
                  color: '#64748b',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 1.25rem',
                }}>
                  <Search size={26} />
                </div>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#0f172a', marginBottom: '0.5rem' }}>
                  No matches found for &ldquo;{queryParam}&rdquo;
                </h3>
                <p style={{ color: '#64748b', maxWidth: '440px', margin: '0 auto 1.5rem', fontSize: '0.92rem' }}>
                  We couldn&apos;t find any records matching your search in this category. Try adjusting your query or switching categories.
                </p>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem' }}>
                  {activeType !== 'ALL' && (
                    <button
                      onClick={() => handleTabChange('ALL')}
                      style={{
                        backgroundColor: '#2563eb',
                        color: '#ffffff',
                        border: 'none',
                        padding: '0.55rem 1.2rem',
                        borderRadius: '0.5rem',
                        fontSize: '0.88rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                      }}
                    >
                      Search All Categories
                    </button>
                  )}
                  <button
                    onClick={clearSearch}
                    style={{
                      backgroundColor: '#f1f5f9',
                      color: '#475569',
                      border: '1px solid #e2e8f0',
                      padding: '0.55rem 1.2rem',
                      borderRadius: '0.5rem',
                      fontSize: '0.88rem',
                      fontWeight: 600,
                      cursor: 'pointer',
                    }}
                  >
                    Clear Filter
                  </button>
                </div>
              </div>
            ) : (
              /* Results Cards */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ fontSize: '0.9rem', color: '#64748b', marginBottom: '0.25rem' }}>
                  Showing <strong style={{ color: '#0f172a' }}>{displayedResults.length}</strong> {activeType === 'ALL' ? 'results across all categories' : `${activeType.toLowerCase()} results`}
                </div>

                {displayedResults.map((item) => {
                  const badge = getBadgeConfig(item.type);
                  return (
                    <div
                      key={`${item.type}-${item.id}`}
                      style={{
                        backgroundColor: '#ffffff',
                        borderRadius: '0.85rem',
                        border: '1px solid #e2e8f0',
                        padding: '1.25rem 1.5rem',
                        boxShadow: '0 2px 8px rgba(15, 23, 42, 0.04)',
                        transition: 'all 0.2s ease',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.75rem',
                      }}
                    >
                      {/* Top Row: Badges & Date */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              padding: '0.25rem 0.65rem',
                              backgroundColor: badge.bg,
                              color: badge.color,
                              border: `1px solid ${badge.border}`,
                              borderRadius: '9999px',
                              fontSize: '0.75rem',
                              fontWeight: 700,
                            }}
                          >
                            {badge.icon}
                            {badge.label}
                          </span>

                          {item.category && (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.25rem',
                                padding: '0.2rem 0.55rem',
                                backgroundColor: '#f1f5f9',
                                color: '#475569',
                                borderRadius: '9999px',
                                fontSize: '0.72rem',
                                fontWeight: 600,
                              }}
                            >
                              <Tag size={12} />
                              {item.category}
                            </span>
                          )}
                        </div>

                        {item.createdAt && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94a3b8', fontSize: '0.75rem' }}>
                            <Clock size={12} />
                            {new Date(item.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </div>
                        )}
                      </div>

                      {/* Title & Description */}
                      <div>
                        <Link
                          to={item.url}
                          style={{
                            fontSize: '1.15rem',
                            fontWeight: 700,
                            color: '#0f172a',
                            textDecoration: 'none',
                            lineHeight: 1.35,
                            display: 'inline-block',
                            marginBottom: '0.35rem',
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.color = '#2563eb')}
                          onMouseLeave={(e) => (e.currentTarget.style.color = '#0f172a')}
                        >
                          {item.title}
                        </Link>
                        {item.description && (
                          <p style={{
                            color: '#64748b',
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            margin: 0,
                            display: '-webkit-box',
                            WebkitLineClamp: 2,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}>
                            {item.description}
                          </p>
                        )}
                      </div>

                      {/* Extra Meta and Action CTA */}
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: '0.75rem',
                        paddingTop: '0.5rem',
                        borderTop: '1px solid #f8fafc',
                      }}>
                        {/* Left Side: Author or Extra attributes */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem', color: '#64748b' }}>
                          {item.authorName && (
                            <div>
                              By <strong style={{ color: '#334155' }}>{item.authorName}</strong>
                            </div>
                          )}

                          {item.type === 'CAUSE' && item.extra?.targetAmount && (
                            <div>
                              Goal: <strong style={{ color: '#059669' }}>${Number(item.extra.targetAmount).toLocaleString()}</strong>
                              {item.extra.raisedAmount !== undefined && (
                                <span style={{ marginLeft: '4px', color: '#64748b' }}>
                                  (${Number(item.extra.raisedAmount).toLocaleString()} raised)
                                </span>
                              )}
                            </div>
                          )}

                          {item.type === 'REEL' && (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              {item.extra?.viewsCount !== undefined && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <Eye size={13} /> {item.extra.viewsCount}
                                </span>
                              )}
                              {item.extra?.likesCount !== undefined && (
                                <span style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                                  <ThumbsUp size={13} /> {item.extra.likesCount}
                                </span>
                              )}
                            </div>
                          )}

                          {item.type === 'PODCAST' && item.extra?.duration && (
                            <div>
                              Duration: <strong style={{ color: '#4338ca' }}>{item.extra.duration}</strong>
                            </div>
                          )}

                          {item.type === 'BUSINESS' && item.extra?.discountPercentage && (
                            <div>
                              Community Discount: <strong style={{ color: '#2563eb' }}>{item.extra.discountPercentage}% OFF</strong>
                            </div>
                          )}
                        </div>

                        {/* Right Side CTA Button */}
                        <Link
                          to={item.url}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            backgroundColor: badge.bg,
                            color: badge.color,
                            border: `1px solid ${badge.border}`,
                            padding: '0.4rem 0.85rem',
                            borderRadius: '0.5rem',
                            fontSize: '0.82rem',
                            fontWeight: 700,
                            textDecoration: 'none',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          {badge.actionText}
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
