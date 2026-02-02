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
    noPosts: language === 'ko' ? '아직 공유된 꿈이 없어요' : 'No dreams shared yet',
    beFirst: language === 'ko' ? '첫 번째로 공유해보세요!' : 'Be the first to share!',
    likes: language === 'ko' ? '공감' : 'likes',
    delete: language === 'ko' ? '삭제' : 'Delete',
    deleteConfirm: language === 'ko' ? '정말 삭제하시겠습니까?' : 'Are you sure you want to delete this?',
    myPost: language === 'ko' ? '내 꿈' : 'My dream',
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
        .from('profiles')
        .select('id, nickname')
        .in('id', userIds);

      const nicknames: { [key: string]: string } = {};
      profilesData?.forEach(profile => {
        nicknames[profile.id] = profile.nickname || 'dreamer';
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
      <style>{`
        @media (max-width: 1200px) {
          .masonry-grid { column-count: 4 !important; }
        }
        @media (max-width: 1000px) {
          .masonry-grid { column-count: 3 !important; }
        }
        @media (max-width: 700px) {
          .masonry-grid { column-count: 2 !important; }
        }
        @media (max-width: 500px) {
          .masonry-grid { column-count: 2 !important; column-gap: 12px !important; }
          .masonry-card { border-radius: 12px !important; }
        }
        .masonry-card {
          break-inside: avoid;
          margin-bottom: 20px;
          border-radius: 16px;
          overflow: hidden;
          background: white;
          cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.06);
        }
        .masonry-card:hover {
          transform: translateY(-4px);
          box-shadow: 0 12px 28px rgba(0,0,0,0.12);
        }
      `}</style>
      <div className="masonry-grid" style={{
        maxWidth: '1600px',
        margin: '0 auto',
        columnCount: 5,
        columnGap: '20px',
        paddingBottom: '60px',
      }}>
          {posts.map(post => (
            <div
              key={post.id}
              className="masonry-card"
              onClick={() => setSelectedPost(post)}
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
              {/* Minimal bottom bar - like only */}
              <div style={{
                padding: '12px 14px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}>
                {/* Like button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike(post.id, post.liked_by_user);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    color: post.liked_by_user ? '#e74c3c' : '#999',
                    fontSize: '0.9rem',
                    fontWeight: 500,
                    transition: 'transform 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
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
                  {post.like_count > 0 && <span>{post.like_count}</span>}
                </button>

                {/* Delete for own posts */}
                {user && post.user_id === user.id && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDelete(post.id, post.image_url);
                    }}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: '4px',
                      color: '#ccc',
                      transition: 'color 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.color = '#e74c3c';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.color = '#ccc';
                    }}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                  </button>
                )}
              </div>
            </div>
          ))}
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
              color: 'white',
            }}>
              {/* Author & Delete */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px'
              }}>
                <span style={{
                  fontSize: '0.9rem',
                  opacity: 0.8,
                }}>
                  @{selectedPost.nickname}
                </span>
                {user && selectedPost.user_id === user.id && (
                  <button
                    onClick={() => handleDelete(selectedPost.id, selectedPost.image_url)}
                    style={{
                      background: 'rgba(231, 76, 60, 0.2)',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '6px 12px',
                      cursor: 'pointer',
                      color: '#e74c3c',
                      fontSize: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px'
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polyline points="3 6 5 6 21 6"/>
                      <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    {t.delete}
                  </button>
                )}
              </div>

              {/* Caption & Like */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
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
        </div>
      )}
    </>
  );
}
