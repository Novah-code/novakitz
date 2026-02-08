'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface CommunityPost {
  id: string;
  user_id: string;
  image_url: string;
  caption: string | null;
  created_at: string;
  like_count: number;
  liked_by_user: boolean;
  nickname: string;
}

interface CommunityFeedProps {
  user: User | null;
  language: 'en' | 'ko';
  refreshKey: number;
}

export default function CommunityFeed({ user, language, refreshKey }: CommunityFeedProps) {
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<CommunityPost | null>(null);

  const t = {
    noPosts: language === 'ko' ? '아직 공유된 이미지가 없어요' : 'No images shared yet',
    beFirst: language === 'ko' ? '첫 번째로 공유해보세요' : 'Be the first to share',
    deleteConfirm: language === 'ko' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this?',
  };

  useEffect(() => {
    loadPosts();
  }, [refreshKey, user]);

  const loadPosts = async () => {
    try {
      // Get posts with like counts
      const { data: postsData, error: postsError } = await supabase
        .from('community_posts')
        .select('*')
        .order('created_at', { ascending: false });

      if (postsError) throw postsError;

      if (!postsData || postsData.length === 0) {
        setPosts([]);
        setLoading(false);
        return;
      }

      // Get user profiles for nicknames
      const userIds = [...new Set(postsData.map(p => p.user_id))];
      const { data: profilesData } = await supabase
        .from('user_profiles')
        .select('user_id, full_name')
        .in('user_id', userIds);

      const nicknames: { [key: string]: string } = {};
      profilesData?.forEach(profile => {
        nicknames[profile.user_id] = profile.full_name || 'dreamer';
      });

      // Get like counts for each post
      const { data: likesData } = await supabase
        .from('post_likes')
        .select('post_id');

      // Get user's likes if logged in
      let userLikes: string[] = [];
      if (user) {
        const { data: userLikesData } = await supabase
          .from('post_likes')
          .select('post_id')
          .eq('user_id', user.id);
        userLikes = userLikesData?.map(l => l.post_id) || [];
      }

      // Count likes per post
      const likeCounts: { [key: string]: number } = {};
      likesData?.forEach(like => {
        likeCounts[like.post_id] = (likeCounts[like.post_id] || 0) + 1;
      });

      // Combine data
      const postsWithLikes: CommunityPost[] = postsData.map(post => ({
        ...post,
        like_count: likeCounts[post.id] || 0,
        liked_by_user: userLikes.includes(post.id),
        nickname: nicknames[post.user_id] || 'dreamer'
      }));

      setPosts(postsWithLikes);
    } catch (error) {
      console.error('Error loading posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId: string, isLiked: boolean) => {
    if (!user) {
      window.location.href = '/';
      return;
    }

    // Optimistic update
    setPosts(prev => prev.map(post => {
      if (post.id === postId) {
        return {
          ...post,
          liked_by_user: !isLiked,
          like_count: isLiked ? post.like_count - 1 : post.like_count + 1
        };
      }
      return post;
    }));

    // Update selected post if open
    if (selectedPost?.id === postId) {
      setSelectedPost(prev => prev ? {
        ...prev,
        liked_by_user: !isLiked,
        like_count: isLiked ? prev.like_count - 1 : prev.like_count + 1
      } : null);
    }

    try {
      if (isLiked) {
        await supabase
          .from('post_likes')
          .delete()
          .eq('post_id', postId)
          .eq('user_id', user.id);
      } else {
        await supabase
          .from('post_likes')
          .insert({ post_id: postId, user_id: user.id });
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      // Revert on error
      loadPosts();
    }
  };

  const handleDelete = async (postId: string, imageUrl: string) => {
    if (!user) return;

    if (!confirm(t.deleteConfirm)) return;

    try {
      // Delete from storage
      const fileName = imageUrl.split('/').pop();
      if (fileName) {
        await supabase.storage
          .from('community-images')
          .remove([`${user.id}/${fileName}`]);
      }

      // Delete post record
      const { error } = await supabase
        .from('community_posts')
        .delete()
        .eq('id', postId)
        .eq('user_id', user.id);

      if (error) throw error;

      // Update local state
      setPosts(prev => prev.filter(p => p.id !== postId));
      setSelectedPost(null);
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  const handleDownload = async (imageUrl: string) => {
    try {
      // Detect iOS (iPhone, iPad, iPod) - includes iPad on iOS 13+
      const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) ||
        (navigator.maxTouchPoints > 1 && /Macintosh/.test(navigator.userAgent));

      if (isIOS) {
        // iOS Safari: Open image directly in new tab for long-press save
        // This is the most reliable method on iOS
        window.open(imageUrl, '_blank');
        return;
      }

      // For non-iOS browsers: Use blob download
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `dream-${Date.now()}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading image:', error);
      // Fallback: open in new tab
      window.open(imageUrl, '_blank');
    }
  };

  const handleOpenInNewTab = (imageUrl: string) => {
    window.open(imageUrl, '_blank');
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '6rem'
      }}>
        <div style={{
          width: '32px',
          height: '32px',
          border: '2px solid rgba(0, 0, 0, 0.1)',
          borderTopColor: '#333',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div style={{
        textAlign: 'center',
        padding: '6rem 2rem',
        color: '#666'
      }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" style={{ opacity: 0.3 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p style={{ fontSize: '1rem', marginBottom: '0.5rem', fontWeight: '500' }}>{t.noPosts}</p>
        <p style={{ fontSize: '0.85rem', opacity: 0.6 }}>{t.beFirst}</p>
      </div>
    );
  }

  return (
    <>
      {/* Cosmos-style Masonry Grid */}
      <style>{`
        @media (max-width: 1400px) {
          .cosmos-grid { column-count: 4 !important; }
        }
        @media (max-width: 1100px) {
          .cosmos-grid { column-count: 3 !important; }
        }
        @media (max-width: 800px) {
          .cosmos-grid { column-count: 2 !important; }
        }
        @media (max-width: 480px) {
          .cosmos-grid { column-count: 2 !important; column-gap: 8px !important; }
          .cosmos-card { margin-bottom: 8px !important; }
        }
        .cosmos-card {
          break-inside: avoid;
          margin-bottom: 12px;
          overflow: hidden;
          cursor: pointer;
          position: relative;
          display: inline-block;
          width: 100%;
        }
        .cosmos-card img {
          width: 100%;
          display: block;
          transition: opacity 0.3s ease;
        }
        .cosmos-card:hover img {
          opacity: 0.92;
        }
        .cosmos-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: linear-gradient(to bottom, rgba(0,0,0,0.3) 0%, transparent 30%, transparent 70%, rgba(0,0,0,0.4) 100%);
          opacity: 0;
          transition: opacity 0.3s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 12px;
        }
        .cosmos-card:hover .cosmos-overlay {
          opacity: 1;
        }
        .cosmos-actions {
          display: flex;
          gap: 8px;
          justify-content: flex-end;
        }
        .cosmos-btn {
          background: rgba(255,255,255,0.95);
          border: none;
          border-radius: 50%;
          width: 36px;
          height: 36px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          color: #333;
          transition: all 0.2s;
          box-shadow: 0 2px 8px rgba(0,0,0,0.15);
        }
        .cosmos-btn:hover {
          transform: scale(1.1);
          background: white;
        }
        .cosmos-bottom {
          display: flex;
          align-items: center;
          gap: 6px;
          color: white;
          font-size: 14px;
          font-weight: 500;
        }
      `}</style>
      <div className="cosmos-grid" style={{
        maxWidth: '1800px',
        margin: '0 auto',
        columnCount: 5,
        columnGap: '12px',
        paddingBottom: '60px',
      }}>
          {posts.map(post => (
            <div
              key={post.id}
              className="cosmos-card"
              onClick={() => setSelectedPost(post)}
            >
              <img
                src={post.image_url}
                alt="Dream"
                loading="lazy"
              />
              {/* Hover overlay with actions */}
              <div className="cosmos-overlay">
                {/* Top actions */}
                <div className="cosmos-actions">
                  {/* Open in new tab */}
                  <button
                    className="cosmos-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenInNewTab(post.image_url);
                    }}
                    title="Open"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                      <polyline points="15 3 21 3 21 9"/>
                      <line x1="10" y1="14" x2="21" y2="3"/>
                    </svg>
                  </button>
                  {/* Download */}
                  <button
                    className="cosmos-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDownload(post.image_url);
                    }}
                    title="Download"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                      <polyline points="7 10 12 15 17 10"/>
                      <line x1="12" y1="15" x2="12" y2="3"/>
                    </svg>
                  </button>
                </div>
                {/* Bottom - likes count */}
                <div className="cosmos-bottom">
                  {post.like_count > 0 && (
                    <>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" strokeWidth="2">
                        <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                      </svg>
                      <span>{post.like_count}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>

      {/* Post Detail Modal - Cosmos Style */}
      {selectedPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px',
          }}
          onClick={() => setSelectedPost(null)}
        >
          <div
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              position: 'relative',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top action bar */}
            <div style={{
              position: 'absolute',
              top: '-50px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}>
              {/* Left - Delete (only for own posts) */}
              <div>
                {user && selectedPost.user_id === user.id && (
                  <button
                    onClick={() => handleDelete(selectedPost.id, selectedPost.image_url)}
                    style={{
                      background: 'rgba(255,255,255,0.15)',
                      border: 'none',
                      borderRadius: '50%',
                      width: '40px',
                      height: '40px',
                      cursor: 'pointer',
                      color: 'white',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(231, 76, 60, 0.8)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                    }}
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>

              {/* Right - Download & Close */}
              <div style={{ display: 'flex', gap: '10px' }}>
                <button
                  onClick={() => handleDownload(selectedPost.image_url)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    color: 'white',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="7 10 12 15 17 10"/>
                    <line x1="12" y1="15" x2="12" y2="3"/>
                  </svg>
                </button>
                <button
                  onClick={() => setSelectedPost(null)}
                  style={{
                    background: 'rgba(255,255,255,0.15)',
                    border: 'none',
                    borderRadius: '50%',
                    width: '40px',
                    height: '40px',
                    cursor: 'pointer',
                    color: 'white',
                    fontSize: '18px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                  }}
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Image */}
            <img
              src={selectedPost.image_url}
              alt="Dream"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 100px)',
                display: 'block',
              }}
            />

            {/* Bottom bar - Like only (numbers only) */}
            <div style={{
              position: 'absolute',
              bottom: '-50px',
              left: 0,
              right: 0,
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}>
              <button
                onClick={() => handleLike(selectedPost.id, selectedPost.liked_by_user)}
                style={{
                  background: 'rgba(255,255,255,0.15)',
                  border: 'none',
                  borderRadius: '24px',
                  padding: '10px 20px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: selectedPost.liked_by_user ? '#e74c3c' : 'white',
                  fontSize: '1rem',
                  fontWeight: '500',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.15)';
                }}
              >
                <svg
                  width="20"
                  height="20"
                  viewBox="0 0 24 24"
                  fill={selectedPost.liked_by_user ? '#e74c3c' : 'none'}
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {selectedPost.like_count}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
