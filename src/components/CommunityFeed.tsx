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
    noPosts: language === 'ko' ? '아직 공유된 꿈이 없어요' : 'No dreams shared yet',
    beFirst: language === 'ko' ? '첫 번째로 공유해보세요!' : 'Be the first to share!',
    likes: language === 'ko' ? '공감' : 'likes',
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
        liked_by_user: userLikes.includes(post.id)
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

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        padding: '4rem'
      }}>
        <div style={{
          width: '40px',
          height: '40px',
          border: '3px solid rgba(127, 176, 105, 0.2)',
          borderTopColor: '#7FB069',
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
        padding: '4rem 2rem',
        color: 'var(--sage, #6b8e63)'
      }}>
        <div style={{ fontSize: '3rem', marginBottom: '1rem', opacity: 0.5 }}>
          <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" style={{ opacity: 0.4 }}>
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
        </div>
        <p style={{ fontSize: '1.1rem', marginBottom: '0.5rem' }}>{t.noPosts}</p>
        <p style={{ fontSize: '0.9rem', opacity: 0.7 }}>{t.beFirst}</p>
      </div>
    );
  }

  return (
    <>
      {/* Masonry Grid */}
      <div style={{
        maxWidth: '1400px',
        margin: '0 auto',
        columnCount: 4,
        columnGap: '16px',
      }}>
        <style>{`
          @media (max-width: 1200px) {
            .masonry-grid { column-count: 3 !important; }
          }
          @media (max-width: 900px) {
            .masonry-grid { column-count: 2 !important; }
          }
          @media (max-width: 500px) {
            .masonry-grid { column-count: 2 !important; column-gap: 10px !important; }
          }
        `}</style>
        <div className="masonry-grid" style={{
          columnCount: 4,
          columnGap: '16px',
        }}>
          {posts.map(post => (
            <div
              key={post.id}
              style={{
                breakInside: 'avoid',
                marginBottom: '16px',
                borderRadius: '16px',
                overflow: 'hidden',
                background: 'white',
                boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                cursor: 'pointer',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }}
              onClick={() => setSelectedPost(post)}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 8px 24px rgba(0,0,0,0.12)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
              }}
            >
              <img
                src={post.image_url}
                alt="Dream"
                style={{
                  width: '100%',
                  display: 'block',
                }}
                loading="lazy"
              />
              {/* Like indicator overlay */}
              <div style={{
                padding: '10px 12px',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                fontSize: '0.85rem',
                color: 'var(--sage, #6b8e63)'
              }}>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id, post.liked_by_user);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    color: post.liked_by_user ? '#e74c3c' : 'var(--sage, #6b8e63)',
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill={post.liked_by_user ? '#e74c3c' : 'none'}
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                  </svg>
                  <span>{post.like_count}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Post Detail Modal */}
      {selectedPost && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
            WebkitBackdropFilter: 'blur(10px)',
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
            {/* Close button */}
            <button
              onClick={() => setSelectedPost(null)}
              style={{
                position: 'absolute',
                top: '-40px',
                right: '0',
                background: 'rgba(255,255,255,0.2)',
                border: 'none',
                borderRadius: '50%',
                width: '36px',
                height: '36px',
                cursor: 'pointer',
                color: 'white',
                fontSize: '20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              ✕
            </button>

            {/* Image */}
            <img
              src={selectedPost.image_url}
              alt="Dream"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(90vh - 80px)',
                borderRadius: '16px',
                display: 'block',
              }}
            />

            {/* Caption & Like */}
            <div style={{
              marginTop: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              color: 'white',
            }}>
              <p style={{
                fontSize: '0.95rem',
                opacity: 0.9,
                margin: 0,
                flex: 1,
              }}>
                {selectedPost.caption || ''}
              </p>
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
                  fontSize: '0.95rem',
                  transition: 'all 0.2s',
                  marginLeft: '16px',
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
                {selectedPost.like_count} {t.likes}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
