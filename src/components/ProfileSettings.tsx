'use client';

import { goTo } from '../lib/platform';
import { useState, useRef, useEffect, useCallback } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ReminderSettings from './ReminderSettings';
import { loadStreak, nextMilestone, type Streak } from '../lib/streak';

interface ProfileSettingsProps {
  user: User;
  profile: UserProfile | null;
  language: 'en' | 'ko';
  onClose: () => void;
  onSave?: () => void;
  streak?: number;
  isPremium?: boolean;
}

type TabType = 'profile' | 'account' | 'subscription' | 'streak';

export default function ProfileSettings({ user, profile, language, onClose, onSave, streak = 0, isPremium = false }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState(profile?.full_name || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [usernameError, setUsernameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Streak states
  const [streakData, setStreakData] = useState<Streak | null>(null);
  const [streakLoading, setStreakLoading] = useState(false);

  const dayNames = language === 'ko'
    ? ['일', '월', '화', '수', '목', '금', '토']
    : ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  /*
   * This tab used to count the streak itself, from dreams only, while the badge
   * on the home screen counted dreams and check-ins through src/lib/streak.ts.
   * Two counts of the same thing meant the badge could read 1 while this read 0
   * — which looked like the streak had failed to save. There is one count now.
   */
  const loadStreakData = useCallback(async () => {
    setStreakLoading(true);
    try {
      setStreakData(await loadStreak(user.id));
    } finally {
      setStreakLoading(false);
    }
  }, [user.id]);

  useEffect(() => {
    if (activeTab === 'streak' && !streakData) {
      loadStreakData();
    }
  }, [activeTab, streakData, loadStreakData]);

  const displayName = username || profile?.full_name || user.email?.split('@')[0] || 'User';

  const t = {
    profile: language === 'ko' ? '프로필' : 'Profile',
    account: language === 'ko' ? '계정' : 'Account',
    subscription: language === 'ko' ? '구독' : 'Subscription',
    username: language === 'ko' ? '사용자 이름' : 'Username',
    fullName: language === 'ko' ? '이름' : 'Full name',
    website: language === 'ko' ? '웹사이트' : 'Website',
    bio: language === 'ko' ? '소개' : 'Bio',
    save: language === 'ko' ? '저장' : 'Save',
    saving: language === 'ko' ? '저장 중...' : 'Saving...',
    email: language === 'ko' ? '이메일' : 'Email',
    plan: language === 'ko' ? '현재 플랜' : 'Current Plan',
    freePlan: language === 'ko' ? '무료' : 'Free',
    premiumPlan: 'Pro',
    logout: language === 'ko' ? '로그아웃' : 'Sign out',
    deleteAccount: language === 'ko' ? '계정 삭제' : 'Delete Account',
    deleteConfirm: language === 'ko' ? '정말 계정을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.' : 'Are you sure you want to delete your account? This action cannot be undone.',
    streak: language === 'ko' ? '연속 기록' : 'Streak',
    days: language === 'ko' ? '일' : 'days',
  };

  // Must stay identical to validateNickname in UserProfileForm — see the note
  // there. The two drifted apart once and made a signed-up name unsaveable.
  const validateUsername = (name: string): { isValid: boolean; error: string } => {
    const trimmed = name.trim();

    if (trimmed.length < 2) {
      return { isValid: false, error: language === 'ko' ? '두 글자 이상 적어주세요' : 'At least two letters' };
    }
    if (trimmed.length > 20) {
      return { isValid: false, error: language === 'ko' ? '스무 글자까지 됩니다' : 'Up to twenty letters' };
    }

    // Letters and the spaces between them. Names have spaces; handles did not.
    if (!/^[a-zA-Z]+(?: [a-zA-Z]+)*$/.test(trimmed)) {
      return { isValid: false, error: language === 'ko' ? '영문으로 적어주세요' : 'Letters only, please' };
    }

    return { isValid: true, error: '' };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        console.error('Invalid file type:', file.type);
        alert(language === 'ko' ? '이미지 파일만 업로드할 수 있습니다' : 'Only image files are allowed');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        console.error('File too large:', file.size);
        alert(language === 'ko' ? '이미지 크기는 5MB 이하여야 합니다' : 'Image must be less than 5MB');
        return;
      }

      console.log('Starting upload...', { fileName: file.name, fileSize: file.size, fileType: file.type });

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;

      console.log('Uploading to avatars bucket with filename:', fileName);

      // Upload directly to root of avatars bucket (no subfolder)
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error('Supabase storage upload error:', {
          message: uploadError.message,
          name: uploadError.name,
          error: uploadError
        });

        // Provide more specific error messages
        if (uploadError.message?.includes('Bucket not found')) {
          alert(language === 'ko' ? '저장소가 설정되지 않았습니다. 관리자에게 문의하세요.' : 'Storage not configured. Please contact support.');
        } else if (uploadError.message?.includes('not authorized') || uploadError.message?.includes('policy')) {
          alert(language === 'ko' ? '업로드 권한이 없습니다. 다시 로그인해주세요.' : 'Upload not authorized. Please sign in again.');
        } else {
          alert(language === 'ko' ? `업로드 실패: ${uploadError.message}` : `Upload failed: ${uploadError.message}`);
        }
        return;
      }

      console.log('Upload successful:', uploadData);

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      console.log('Public URL:', publicUrl);
      setProfileImage(publicUrl);

      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(language === 'ko' ? `이미지 업로드에 실패했습니다: ${error?.message || '알 수 없는 오류'}` : `Failed to upload image: ${error?.message || 'Unknown error'}`);
    }
  };

  const handleSave = async () => {
    if (activeTab === 'profile') {
      // Validate username
      if (username) {
        const validation = validateUsername(username);
        if (!validation.isValid) {
          setUsernameError(validation.error);
          return;
        }
      }

      setSaving(true);
      try {
        const { error } = await supabase
          .from('user_profiles')
          .upsert({
            user_id: user.id,
            full_name: username,
            bio: bio,
            website: website,
            avatar_url: profileImage,
          }, { onConflict: 'user_id' });

        if (error) throw error;

        // Update nickname if changed
        if (username && username !== profile?.full_name) {
          await supabase
            .from('nicknames')
            .upsert({ user_id: user.id, nickname: username }, { onConflict: 'user_id' });
        }

        onSave?.();
      } catch (error) {
        console.error('Error saving profile:', error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/';
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      // Delete user data from various tables
      await supabase.from('dreams').delete().eq('user_id', user.id);
      await supabase.from('user_profiles').delete().eq('user_id', user.id);
      await supabase.from('nicknames').delete().eq('user_id', user.id);
      await supabase.from('community_posts').delete().eq('user_id', user.id);
      await supabase.from('community_likes').delete().eq('user_id', user.id);
      await supabase.from('user_subscriptions').delete().eq('user_id', user.id);

      // Sign out and redirect
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (error) {
      console.error('Error deleting account:', error);
      setDeleting(false);
    }
  };

  const tabs: { id: TabType; label: string; hasNotification?: boolean }[] = [
    { id: 'profile', label: t.profile },
    { id: 'account', label: t.account },
    { id: 'subscription', label: t.subscription },
    { id: 'streak', label: t.streak },
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
      onClick={onClose}
    >
      <div
        className="profile-settings-modal"
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          height: '560px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div className="profile-settings-sidebar" style={{
          width: '240px',
          background: '#fafafa',
          padding: '24px',
          borderRight: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Profile Photo */}
          <div className="profile-sidebar-photo" style={{
            position: 'relative',
            width: '100px',
            height: '100px',
            margin: '0 auto 16px',
          }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: profileImage
                ? `url(${profileImage}) center/cover`
                : 'linear-gradient(135deg, #7FB069 0%, #9BC88B 50%, #B8D4A8 100%)',
              position: 'relative',
            }}>
              {/* Edit button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: 'white',
                  border: '1px solid #e5e5e5',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                }}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#666" strokeWidth="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              style={{ display: 'none' }}
            />
          </div>

          {/* Username Display */}
          <div className="profile-sidebar-username" style={{ textAlign: 'center', marginBottom: '8px' }}>
            <p style={{
              fontSize: '16px',
              fontWeight: '600',
              color: '#111',
              margin: 0,
            }}>
              {displayName}
            </p>
          </div>

          {/* Streak Display */}
          {streak > 0 && (
            <div style={{
              textAlign: 'center',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              color: '#f59e0b',
              fontSize: '14px',
              fontWeight: '500',
            }}>
              <span>🔥</span>
              <span>{streak} {t.days}</span>
            </div>
          )}

          {/* Navigation */}
          <nav className="profile-sidebar-nav" style={{ flex: 1 }}>
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  background: activeTab === tab.id ? '#f0f0f0' : 'transparent',
                  border: 'none',
                  borderRadius: '8px',
                  textAlign: 'left',
                  fontSize: '15px',
                  color: activeTab === tab.id ? '#111' : '#666',
                  fontWeight: activeTab === tab.id ? '500' : '400',
                  cursor: 'pointer',
                  marginBottom: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  transition: 'all 0.15s',
                }}
              >
                {tab.label}
                {tab.hasNotification && (
                  <span style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                  }} />
                )}
              </button>
            ))}
          </nav>

          {/* Sign Out Button */}
          <button
            className="profile-sidebar-signout"
            onClick={handleLogout}
            style={{
              width: '100%',
              padding: '12px 16px',
              background: 'transparent',
              border: 'none',
              borderRadius: '8px',
              textAlign: 'left',
              fontSize: '15px',
              color: '#888',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              transition: 'all 0.15s',
              marginTop: '8px',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = '#f0f0f0';
              e.currentTarget.style.color = '#666';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = '#888';
            }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            {t.logout}
          </button>
        </div>

        {/* Main Content */}
        <div className="profile-content" style={{
          flex: 1,
          padding: '24px 32px',
          overflowY: 'auto',
          position: 'relative',
        }}>
          {/* Close Button */}
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: '16px',
              right: '16px',
              width: '32px',
              height: '32px',
              background: '#e5e5e5',
              border: 'none',
              cursor: 'pointer',
              color: '#888',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#d5d5d5'}
            onMouseLeave={(e) => e.currentTarget.style.background = '#e5e5e5'}
          >
            ✕
          </button>

          {/* Title */}
          <h2 style={{
            fontSize: '24px',
            fontWeight: '400',
            color: '#111',
            marginBottom: '32px',
            fontFamily: "'Times New Roman', serif",
          }}>
            {activeTab === 'profile' ? t.profile : activeTab === 'account' ? t.account : activeTab === 'streak' ? t.streak : t.subscription}
          </h2>

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Username */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px 16px',
                position: 'relative',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.username}
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <span style={{ color: '#888', marginRight: '2px' }}>@</span>
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => {
                      setUsername(e.target.value);
                      setUsernameError('');
                    }}
                    style={{
                      flex: 1,
                      border: 'none',
                      outline: 'none',
                      fontSize: '15px',
                      color: '#111',
                      background: 'transparent',
                    }}
                  />
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="2" style={{ cursor: 'pointer' }}>
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </div>
                {usernameError && (
                  <p style={{ color: '#ef4444', fontSize: '12px', marginTop: '8px' }}>{usernameError}</p>
                )}
              </div>

              {/* Website */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px 16px',
                position: 'relative',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.website}
                </label>
                <input
                  type="text"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://"
                  style={{
                    width: '100%',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    color: '#111',
                    background: 'transparent',
                  }}
                />
              </div>

              {/* Bio */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px 16px',
                position: 'relative',
                minHeight: '120px',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.bio}
                </label>
                <div style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {bio.length}/68
                </div>
                <textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value.slice(0, 68))}
                  maxLength={68}
                  style={{
                    width: '100%',
                    height: '80px',
                    border: 'none',
                    outline: 'none',
                    fontSize: '15px',
                    color: '#111',
                    background: 'transparent',
                    resize: 'none',
                    fontFamily: 'inherit',
                  }}
                />
              </div>

              {/* Save Button */}
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  alignSelf: 'flex-end',
                  padding: '10px 24px',
                  background: '#e5e5e5',
                  color: '#555',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => {
                  if (!saving) {
                    e.currentTarget.style.background = '#d5d5d5';
                  }
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = '#e5e5e5';
                }}
              >
                {saving ? t.saving : t.save}
              </button>
            </div>
          )}

          {/* Account Tab */}
          {activeTab === 'account' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Nickname */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px 16px',
                position: 'relative',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.username}
                </label>
                <p style={{ fontSize: '15px', color: '#111', margin: 0 }}>
                  @{displayName}
                </p>
              </div>

              {/* Email (smaller, secondary) */}
              <div style={{
                border: '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '12px 16px',
                position: 'relative',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.email}
                </label>
                <p style={{ fontSize: '15px', color: '#666', margin: 0 }}>
                  {user.email}
                </p>
              </div>

              <ReminderSettings language={language} />

              {/*
                * Sign out.
                *
                * The only other one is in the sidebar, and the sidebar collapses
                * to a row of tabs on a phone with that button set to
                * display: none — so on the device the app actually ships to,
                * there was no way to sign out at all. Here it sits with the
                * other account actions, at every width.
                */}
              <button
                onClick={handleLogout}
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid #e5e5e5',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#666',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  width: 'fit-content',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = '#f7f7f7'; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                  <polyline points="16 17 21 12 16 7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
                {t.logout}
              </button>

              {/* Delete Account */}
              {!showDeleteConfirm ? (
                <button
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    padding: '12px 16px',
                    background: 'transparent',
                    border: '1px solid #fecaca',
                    borderRadius: '8px',
                    fontSize: '15px',
                    color: '#ef4444',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.15s',
                    marginTop: '20px',
                    width: 'fit-content',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = '#fef2f2';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  {t.deleteAccount}
                </button>
              ) : (
                <div style={{
                  padding: '16px',
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  marginTop: '20px',
                  width: 'fit-content',
                }}>
                  <p style={{ fontSize: '14px', color: '#dc2626', margin: '0 0 12px 0' }}>
                    {t.deleteConfirm}
                  </p>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      onClick={handleDeleteAccount}
                      disabled={deleting}
                      style={{
                        padding: '10px 16px',
                        background: '#dc2626',
                        border: 'none',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: 'white',
                        cursor: deleting ? 'not-allowed' : 'pointer',
                        opacity: deleting ? 0.7 : 1,
                      }}
                    >
                      {deleting ? (language === 'ko' ? '삭제 중...' : 'Deleting...') : (language === 'ko' ? '삭제' : 'Delete')}
                    </button>
                    <button
                      onClick={() => setShowDeleteConfirm(false)}
                      disabled={deleting}
                      style={{
                        padding: '10px 16px',
                        background: 'white',
                        border: '1px solid #e5e5e5',
                        borderRadius: '6px',
                        fontSize: '14px',
                        color: '#666',
                        cursor: 'pointer',
                      }}
                    >
                      {language === 'ko' ? '취소' : 'Cancel'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Current Plan */}
              <div style={{
                border: isPremium ? '1px solid #7FB069' : '1px solid #e5e5e5',
                borderRadius: '8px',
                padding: '16px',
                position: 'relative',
                background: isPremium
                  ? 'linear-gradient(135deg, rgba(127, 176, 105, 0.05) 0%, rgba(144, 238, 144, 0.05) 100%)'
                  : 'transparent',
              }}>
                <label style={{
                  position: 'absolute',
                  top: '-10px',
                  left: '12px',
                  background: 'white',
                  padding: '0 4px',
                  fontSize: '12px',
                  color: '#888',
                }}>
                  {t.plan}
                </label>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>
                    {isPremium ? '👑' : '✨'}
                  </span>
                  <div>
                    <p style={{
                      fontSize: '16px',
                      fontWeight: '600',
                      color: isPremium ? '#7FB069' : '#111',
                      margin: 0
                    }}>
                      {isPremium ? t.premiumPlan : t.freePlan}
                    </p>
                    <p style={{ fontSize: '13px', color: '#666', margin: '4px 0 0 0' }}>
                      {isPremium
                        ? (language === 'ko' ? 'Pro 이용 중' : 'Pro access')
                        : (language === 'ko' ? '무료 플랜' : 'Free plan')}
                    </p>
                  </div>
                </div>
              </div>

              {/* Upgrade button for free users */}
              {!isPremium && (
                <button
                  onClick={() => { goTo('/pricing/'); }}
                  style={{
                    padding: '14px 20px',
                    background: 'linear-gradient(135deg, #7FB069 0%, #8BC34A 100%)',
                    border: 'none',
                    borderRadius: '8px',
                    fontSize: '15px',
                    fontWeight: '600',
                    color: 'white',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {language === 'ko' ? 'Pro 업그레이드' : 'Upgrade to Pro'}
                </button>
              )}
            </div>
          )}

          {/* Streak Tab */}
          {activeTab === 'streak' && (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', padding: '20px 0' }}>
              {streakLoading ? (
                <p style={{ color: '#666' }}>{language === 'ko' ? '로딩 중...' : 'Loading...'}</p>
              ) : streakData ? (
                <>
                  {/* Streak Circle */}
                  <div style={{
                    position: 'relative',
                    width: '120px',
                    height: '120px',
                  }}>
                    <svg width="120" height="120" viewBox="0 0 120 120">
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#e5e5e5"
                        strokeWidth="8"
                      />
                      <circle
                        cx="60"
                        cy="60"
                        r="54"
                        fill="none"
                        stroke="#7FB069"
                        strokeWidth="8"
                        strokeLinecap="round"
                        strokeDasharray={`${Math.min(streakData.current / nextMilestone(streakData.current), 1) * 339.3} 339.3`}
                        transform="rotate(-90 60 60)"
                      />
                    </svg>
                    <div style={{
                      position: 'absolute',
                      top: '50%',
                      left: '50%',
                      transform: 'translate(-50%, -50%)',
                      fontSize: '36px',
                      fontWeight: '600',
                      color: '#333',
                    }}>
                      {streakData.current}
                    </div>
                  </div>

                  {/*
                    * The ring aims at the next round number rather than a fixed
                    * seven, so it still has somewhere to go after the first week.
                    */}
                  <p style={{ fontSize: '13px', color: '#888', margin: '-12px 0 0' }}>
                    {language === 'ko'
                      ? `다음 ${nextMilestone(streakData.current)}일까지 · 총 ${streakData.total}일`
                      : `${nextMilestone(streakData.current)} days next · ${streakData.total} days in total`}
                  </p>

                  {/*
                    * One missed day a month is forgiven, and saying so is the
                    * point — a streak that quietly survives a gap reads as a bug,
                    * and the allowance only calms anyone who knows it exists.
                    */}
                  {streakData.forgiven > 0 && (
                    <p style={{ fontSize: '12px', color: '#A8A8A8', margin: '-16px 0 0' }}>
                      {language === 'ko'
                        ? '이번 달 하루는 쉬어도 이어집니다'
                        : 'One missed day a month is forgiven'}
                    </p>
                  )}

                  {/* Week Days */}
                  <div style={{
                    display: 'flex',
                    gap: '12px',
                    justifyContent: 'center',
                  }}>
                    {streakData.week.map((day) => (
                      <div key={day.date} style={{ textAlign: 'center' }}>
                        <div style={{
                          fontSize: '12px',
                          color: day.completed ? '#7FB069' : '#999',
                          marginBottom: '8px',
                          fontWeight: day.completed ? '600' : '400',
                        }}>
                          {/* Parsed as local parts — new Date('YYYY-MM-DD') is UTC midnight
                              and lands on the previous day west of Greenwich. */}
                          {dayNames[new Date(
                            Number(day.date.slice(0, 4)),
                            Number(day.date.slice(5, 7)) - 1,
                            Number(day.date.slice(8, 10))
                          ).getDay()]}
                        </div>
                        <div style={{
                          width: '36px',
                          height: '36px',
                          borderRadius: '50%',
                          background: day.completed ? '#7FB069' : '#e5e5e5',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}>
                          {day.completed && (
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
                              <polyline points="20 6 9 17 4 12"/>
                            </svg>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p style={{ color: '#666' }}>{language === 'ko' ? '데이터를 불러올 수 없습니다' : 'Could not load data'}</p>
              )}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .profile-settings-modal {
            flex-direction: column !important;
            max-height: 92vh !important;
            border-radius: 20px !important;
          }
          .profile-settings-sidebar {
            width: 100% !important;
            min-width: 0 !important;
            border-right: none !important;
            border-bottom: 1px solid #f0f0f0 !important;
            padding: 12px 12px 8px !important;
            flex-direction: row !important;
            align-items: center !important;
            flex-shrink: 0 !important;
          }
          .profile-sidebar-photo {
            display: none !important;
          }
          .profile-sidebar-username {
            display: none !important;
          }
          .profile-sidebar-signout {
            display: none !important;
          }
          .profile-sidebar-nav {
            flex-direction: row !important;
            flex: 1 !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
            gap: 4px !important;
            scrollbar-width: none !important;
          }
          .profile-sidebar-nav::-webkit-scrollbar {
            display: none !important;
          }
          .profile-sidebar-nav button {
            white-space: nowrap !important;
            flex-shrink: 0 !important;
            padding: 8px 14px !important;
            font-size: 14px !important;
            margin-bottom: 0 !important;
          }
          .profile-content {
            padding: 16px !important;
            overflow-y: auto !important;
          }
        }
      `}</style>
    </div>
  );
}
