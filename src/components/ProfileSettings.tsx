'use client';

import { goTo } from '../lib/platform';
import { useState, useRef, useEffect } from 'react';
import { supabase, UserProfile } from '../lib/supabase';
import { User } from '@supabase/supabase-js';
import ReminderSettings from './ReminderSettings';
import { canAnalyzeDream } from '../lib/subscription';

interface ProfileSettingsProps {
  user: User;
  profile: UserProfile | null;
  language: 'en' | 'ko';
  onClose: () => void;
  onSave?: () => void;
  streak?: number;
  isPremium?: boolean;
  /** Which tab to open on. The settings sheet uses this to land on Notifications. */
  initialTab?: TabType;
}

type TabType = 'profile' | 'account' | 'subscription' | 'streak';

export default function ProfileSettings({ user, profile, language, onClose, onSave, streak = 0, isPremium = false, initialTab = 'profile' }: ProfileSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [profileImage, setProfileImage] = useState<string | null>(profile?.avatar_url || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form states
  /*
   * Readings left this month.
   *
   * There was an AIUsageWidget for this, imported by
   * SimpleDreamInterfaceWithAuth and never rendered — half in English and half
   * in hardcoded Korean, linking to /pricing/ with a bare href that does not
   * resolve inside Capacitor, and re-querying every five minutes for a number
   * that changes a few times a day. Twenty lines here beat fixing four things
   * in a component nothing was using.
   */
  const [readings, setReadings] = useState<{ remaining: number; limit: number } | null>(null);

  useEffect(() => {
    let cancelled = false;
    canAnalyzeDream(user.id)
      .then(({ remaining, limit }) => { if (!cancelled) setReadings({ remaining, limit }); })
      .catch(() => { /* A settings screen is not worth an error over. */ });
    return () => { cancelled = true; };
  }, [user.id]);

  const [username, setUsername] = useState(profile?.full_name || '');
  const [usernameError, setUsernameError] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  /*
   * One screen, no tabs. The sheet that opens this still says which part it
   * wants — Notifications, or the plan — so that part is scrolled into view.
   */
  const planRef = useRef<HTMLDivElement>(null);
  const remindersRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const target = initialTab === 'subscription' ? planRef.current : initialTab === 'account' ? remindersRef.current : null;
    if (target) setTimeout(() => target.scrollIntoView({ block: 'center', behavior: 'smooth' }), 250);
  }, [initialTab]);

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
    // \p{L} is any script's letters, so 윤아 and Anna both pass and digits,
    // punctuation and emoji still do not.
    if (!/^\p{L}+(?: \p{L}+)*$/u.test(trimmed)) {
      return { isValid: false, error: language === 'ko' ? '문자만 쓸 수 있어요' : 'Letters only, please' };
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

  /*
   * Name and photo only. Website and bio were saved from here and shown nowhere
   * in the app, so the fields are gone — and they are left out of the upsert
   * too, so whatever someone already saved stays in their row.
   */
  const dirty = username !== (profile?.full_name || '') || profileImage !== (profile?.avatar_url || null);

  const handleSave = async () => {
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

  /*
   * The profile as one list on the home screen's sky.
   *
   * It was a white two-column dialog written for a desktop window: a grey
   * sidebar, four tabs, floating-label boxes, website and bio fields that showed
   * nowhere, and a streak tab that repeated the streak window. Now it is a photo
   * and a name, then grouped rows — who you are, your plan, reminders — and the
   * two things you can leave with at the bottom.
   */
  const INK = '#2E3C33';
  const PINK = '#EDA3BC';
  const ko = language === 'ko';
  const displayFont = ko ? "'S-CoreDream', sans-serif" : 'var(--font-display), Georgia, serif';
  const glass: React.CSSProperties = {
    background: 'linear-gradient(180deg, rgba(255,255,255,0.80) 0%, rgba(246,243,234,0.66) 100%)',
    backdropFilter: 'blur(22px) saturate(180%)',
    WebkitBackdropFilter: 'blur(22px) saturate(180%)',
    border: '1px solid rgba(255,255,255,0.85)',
    boxShadow: '0 8px 24px rgba(40,60,45,0.12), inset 0 1px 0 rgba(255,255,255,0.95), inset 0 -1px 0 rgba(92,112,97,0.08)',
  };
  const group: React.CSSProperties = { ...glass, borderRadius: 28, width: '100%', boxSizing: 'border-box', overflow: 'hidden' };
  const sectionLabel: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: 11, letterSpacing: 1.2, color: '#7d8f82', fontWeight: 700,
    margin: '0 0 10px 8px', textTransform: 'uppercase', textAlign: 'left',
  };
  const round: React.CSSProperties = {
    width: 40, height: 40, padding: 0, borderRadius: '50%',
    background: 'rgba(255,255,255,0.92)', border: '1px solid rgba(255,255,255,0.9)',
    boxShadow: '0 2px 10px rgba(40,60,45,0.16)', color: INK, cursor: 'pointer',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  };
  const ico = (path: React.ReactNode) => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{path}</svg>
  );
  const chevron = (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#9aa89f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><polyline points="9 18 15 12 9 6"/></svg>
  );
  const row = (opts: { icon: React.ReactNode; title: string; value?: React.ReactNode; onClick?: () => void; chevron?: boolean; last?: boolean; danger?: boolean; trailing?: React.ReactNode; children?: React.ReactNode }) => (
    <div
      onClick={opts.onClick}
      role={opts.onClick ? 'button' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: 16, padding: '16px 20px',
        borderBottom: opts.last ? 'none' : '1px solid rgba(46,60,51,0.08)',
        cursor: opts.onClick ? 'pointer' : 'default', textAlign: 'left',
        color: opts.danger ? '#B5566F' : INK,
      }}
    >
      <span style={{ display: 'flex', flexShrink: 0, color: opts.danger ? '#B5566F' : '#5d6e63' }}>{opts.icon}</span>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{opts.title}</div>
        {opts.value !== undefined && <div style={{ fontSize: 14, color: '#7d8f82', marginTop: 3, wordBreak: 'break-all' }}>{opts.value}</div>}
        {opts.children}
      </div>
      {opts.trailing}
      {opts.chevron && chevron}
    </div>
  );

  return (
    <div
      className="profile-glass"
      style={{
        position: 'fixed', inset: 0, zIndex: 10010,
        backgroundImage: 'var(--home-sky-day)', backgroundColor: '#F4EEE5',
        overflowY: 'auto', display: 'flex', justifyContent: 'center',
        color: INK, fontFamily: ko ? "'S-CoreDream', sans-serif" : "'Roboto', sans-serif",
      }}
    >
      <div className="home-scene__grain home-scene__grain--flat" aria-hidden="true" />

      <button onClick={onClose} aria-label={ko ? '닫기' : 'Close'} style={{ ...round, position: 'fixed', top: 'calc(env(safe-area-inset-top, 0px) + 12px)', right: 16, zIndex: 3 }}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>
      </button>

      <div style={{
        position: 'relative', zIndex: 2, width: '100%', maxWidth: 520, boxSizing: 'border-box', alignSelf: 'flex-start',
        padding: 'calc(env(safe-area-inset-top, 0px) + 56px) 20px calc(env(safe-area-inset-bottom, 0px) + 48px)',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
      }}>
        {/* Photo and name */}
        <div style={{ position: 'relative', width: 96, height: 96 }}>
          <div style={{
            width: 96, height: 96, borderRadius: '50%',
            background: profileImage ? `url(${profileImage}) center/cover` : 'linear-gradient(135deg, #F7C9B6 0%, #E6C9F2 55%, #F6E7B8 100%)',
            border: '3px solid rgba(255,255,255,0.9)', boxShadow: '0 8px 24px rgba(40,60,45,0.16)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontFamily: displayFont, fontSize: 40, color: INK,
          }}>
            {!profileImage && (displayName[0] ?? '?').toUpperCase()}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            aria-label={ko ? '사진 바꾸기' : 'Change photo'}
            style={{ ...round, position: 'absolute', right: -6, bottom: -4, width: 32, height: 32 }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} style={{ display: 'none' }} />
        </div>
        <p style={{ margin: '16px 0 0', fontFamily: displayFont, fontSize: ko ? 22 : 34, fontWeight: ko ? 500 : 400, lineHeight: 1.2, textAlign: 'center' }}>
          {displayName}
        </p>
        {streak > 0 && (
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: '#7d8f82' }}>
            <span style={{ width: 10, height: 10, borderRadius: '50%', background: PINK }} />
            <span>{streak} {t.days}</span>
          </div>
        )}

        <div style={{ width: '100%', marginTop: 28, display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Who you are */}
          <div>
            <div style={group}>
              {row({
                icon: ico(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
                title: ko ? '이름' : 'Name',
                children: (
                  <input
                    type="text" value={username}
                    onChange={(e) => { setUsername(e.target.value); setUsernameError(''); }}
                    aria-label={ko ? '이름' : 'Name'}
                    style={{ width: '100%', border: 'none', outline: 'none', background: 'transparent', fontSize: 14, color: '#5d6e63', fontFamily: 'inherit', padding: 0, marginTop: 3 }}
                  />
                ),
                trailing: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#9aa89f" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M12 20h9"/><path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z"/></svg>,
              })}
              {row({
                icon: ico(<><rect x="3" y="5" width="18" height="14" rx="2"/><polyline points="3 7 12 13 21 7"/></>),
                title: t.email,
                value: user.email,
                last: true,
              })}
            </div>
            {usernameError && <p style={{ color: '#B5566F', fontSize: 13, margin: '8px 0 0 8px' }}>{usernameError}</p>}
            {dirty && (
              <button
                onClick={handleSave}
                disabled={saving}
                style={{
                  ...glass, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  height: 52, minWidth: 200, margin: '16px auto 0', padding: '0 26px', borderRadius: 26,
                  fontFamily: 'inherit', fontSize: 15, fontWeight: 700, color: INK,
                  cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.5 : 1,
                }}
              >
                {saving ? t.saving : t.save}
              </button>
            )}
          </div>

          {/* Plan and readings */}
          <div ref={planRef}>
            <div style={sectionLabel}>{ko ? '플랜' : 'Plan'}</div>
            <div style={group}>
              {row({
                icon: ico(<path d="M12 3l1.9 5.1L19 10l-5.1 1.9L12 17l-1.9-5.1L5 10l5.1-1.9L12 3z"/>),
                title: isPremium ? t.premiumPlan : t.freePlan,
                value: isPremium ? (ko ? 'Pro 이용 중' : 'Pro access') : (ko ? '무료 플랜' : 'Free plan'),
                onClick: isPremium ? undefined : () => goTo('/pricing/'),
                chevron: !isPremium,
                last: !readings,
              })}
              {readings && row({
                icon: ico(<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>),
                title: ko ? '이번 달 AI 해석' : "This month's AI readings",
                value: (readings.remaining > 0
                  ? (ko ? `${readings.remaining}번 남았어요` : `${readings.remaining} left`)
                  : (ko ? '이번 달은 다 썼어요' : 'None left this month'))
                  + (!isPremium ? (ko ? ` · 월 ${readings.limit}회` : ` · ${readings.limit} a month`) : ''),
                last: true,
              })}
            </div>
            {/*
              * The second sentence is the one that matters: someone checking
              * this is worried the app is about to stop working, and the answer
              * is that the ritual never does — only the model's reply waits.
              * Stated even at zero, especially at zero.
              */}
            <p style={{ fontSize: 13, color: '#7d8f82', margin: '10px 8px 0', lineHeight: 1.6, textAlign: 'left' }}>
              {ko
                ? '조약돌, 꿈, 무드 기록은 횟수 제한 없이 언제나 무료예요.'
                : 'Pebbles, dreams and mood records are always free, with no limit.'}
            </p>
          </div>

          {/* Reminders */}
          <div ref={remindersRef}>
            <div style={group}>
              <div style={{ padding: '16px 20px' }}>
                <ReminderSettings language={language} />
              </div>
            </div>
          </div>

          {/* Leaving */}
          <div>
            <div style={group}>
              {row({
                icon: ico(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></>),
                title: t.logout,
                onClick: handleLogout,
                last: true,
              })}
            </div>

            <p style={{ fontSize: 13, color: '#7d8f82', margin: '14px 8px 12px', lineHeight: 1.6, textAlign: 'left' }}>
              {ko
                ? '계정을 삭제하면 기록이 모두 사라지고 되돌릴 수 없어요.'
                : 'Deleting your account removes your records and cannot be undone.'}
            </p>

            {!showDeleteConfirm ? (
              <div style={{ ...group, background: 'rgba(181,86,111,0.08)', border: '1px solid rgba(181,86,111,0.28)', boxShadow: 'none' }}>
                {row({
                  icon: ico(<><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></>),
                  title: t.deleteAccount,
                  onClick: () => setShowDeleteConfirm(true),
                  danger: true,
                  last: true,
                })}
              </div>
            ) : (
              <div style={{ ...group, padding: '18px 20px', border: '1px solid rgba(181,86,111,0.35)' }}>
                <p style={{ fontSize: 14, color: '#B5566F', margin: '0 0 14px', lineHeight: 1.6, textAlign: 'left' }}>{t.deleteConfirm}</p>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={handleDeleteAccount} disabled={deleting} style={{ flex: 1, height: 46, borderRadius: 23, border: '1px solid rgba(181,86,111,0.4)', background: 'rgba(181,86,111,0.14)', color: '#B5566F', fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: deleting ? 'default' : 'pointer', opacity: deleting ? 0.5 : 1 }}>
                    {deleting ? (ko ? '삭제 중...' : 'Deleting...') : (ko ? '삭제' : 'Delete')}
                  </button>
                  <button onClick={() => setShowDeleteConfirm(false)} disabled={deleting} style={{ ...glass, flex: 1, height: 46, borderRadius: 23, color: INK, fontFamily: 'inherit', fontSize: 15, fontWeight: 700, cursor: 'pointer' }}>
                    {ko ? '취소' : 'Cancel'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .profile-glass .reminder-settings { margin-top: 0; padding-top: 0; border-top: none; }
        .profile-glass .reminder-heading { font-family: monospace; font-size: 11px; letter-spacing: 1.2px; text-transform: uppercase; color: #7d8f82; font-weight: 700; margin-bottom: 8px; }
        .profile-glass .reminder-label { color: ${INK}; font-size: 15px; }
        .profile-glass .reminder-time { background: rgba(255,255,255,0.7); border: 1px solid rgba(255,255,255,0.9); color: ${INK}; border-radius: 12px; padding: 6px 10px; }
        .profile-glass .reminder-note { color: #7d8f82; }
      `}</style>
    </div>
  );
}
