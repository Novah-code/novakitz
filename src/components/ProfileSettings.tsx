'use client';

import { useState, useRef } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';

interface ProfileSettingsProps {
  user: User;
  profile: UserProfile | null;
  language: 'en' | 'ko';
  onClose: () => void;
  onSave?: () => void;
  streak?: number;
}

type TabType = 'profile' | 'account' | 'subscription';

export default function ProfileSettings({ user, profile, language, onClose, onSave, streak = 0 }: ProfileSettingsProps) {
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [username, setUsername] = useState(profile?.full_name || '');
  const [fullName, setFullName] = useState(profile?.display_name || profile?.full_name || '');
  const [website, setWebsite] = useState(profile?.website || '');
  const [bio, setBio] = useState(profile?.bio || '');
  const [usernameError, setUsernameError] = useState('');

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
    logout: language === 'ko' ? '로그아웃' : 'Sign out',
    deleteAccount: language === 'ko' ? '계정 삭제' : 'Delete Account',
    streak: language === 'ko' ? '연속 기록' : 'Streak',
    days: language === 'ko' ? '일' : 'days',
  };

  const validateUsername = (name: string): { isValid: boolean; error: string } => {
    if (name.includes(' ')) {
      return { isValid: false, error: language === 'ko' ? '공백은 사용할 수 없습니다' : 'Spaces are not allowed' };
    }
    if (name.length < 3) {
      return { isValid: false, error: language === 'ko' ? '최소 3자 이상입니다' : 'Minimum 3 characters' };
    }
    if (name.length > 20) {
      return { isValid: false, error: language === 'ko' ? '최대 20자 이내입니다' : 'Maximum 20 characters' };
    }
    const validPattern = /^[a-zA-Z0-9가-힣]+$/;
    if (!validPattern.test(name)) {
      return { isValid: false, error: language === 'ko' ? '영문, 숫자, 한글만 사용 가능합니다' : 'Only letters, numbers, and Korean allowed' };
    }
    return { isValid: true, error: '' };
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `avatars/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setProfileImage(publicUrl);
    } catch (error) {
      console.error('Error uploading image:', error);
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
            display_name: fullName,
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

  const tabs: { id: TabType; label: string; hasNotification?: boolean }[] = [
    { id: 'profile', label: t.profile },
    { id: 'account', label: t.account, hasNotification: true },
    { id: 'subscription', label: t.subscription },
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
        style={{
          background: 'white',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '800px',
          maxHeight: '90vh',
          overflow: 'hidden',
          display: 'flex',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Sidebar */}
        <div style={{
          width: '240px',
          background: '#fafafa',
          padding: '24px',
          borderRight: '1px solid #eee',
          display: 'flex',
          flexDirection: 'column',
        }}>
          {/* Profile Photo */}
          <div style={{
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
                : 'linear-gradient(135deg, #a78bfa 0%, #f472b6 100%)',
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
          <div style={{ textAlign: 'center', marginBottom: '8px' }}>
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
          <nav style={{ flex: 1 }}>
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
        <div style={{
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
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#666',
              fontSize: '20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={(e) => e.currentTarget.style.background = '#f5f5f5'}
            onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
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
            {activeTab === 'profile' ? t.profile : activeTab === 'account' ? t.account : t.subscription}
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

              {/* Full name */}
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
                  {t.fullName}
                </label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
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
                  background: '#111',
                  color: 'white',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: saving ? 'not-allowed' : 'pointer',
                  opacity: saving ? 0.7 : 1,
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

              {/* Streak Info */}
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
                  {t.streak}
                </label>
                <p style={{ fontSize: '15px', color: '#111', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>🔥</span> {streak} {t.days}
                </p>
              </div>

              {/* Delete Account */}
              <button
                style={{
                  padding: '12px 16px',
                  background: 'transparent',
                  border: '1px solid #fecaca',
                  borderRadius: '8px',
                  fontSize: '15px',
                  color: '#ef4444',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'all 0.15s',
                  marginTop: '20px',
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
            </div>
          )}

          {/* Subscription Tab */}
          {activeTab === 'subscription' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {/* Current Plan */}
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
                  {t.plan}
                </label>
                <p style={{ fontSize: '15px', color: '#111', margin: 0 }}>
                  {t.freePlan}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 640px) {
          .profile-settings-modal {
            flex-direction: column !important;
          }
          .profile-settings-sidebar {
            width: 100% !important;
            border-right: none !important;
            border-bottom: 1px solid #eee !important;
            padding: 16px !important;
          }
        }
      `}</style>
    </div>
  );
}
