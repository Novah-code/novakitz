'use client';

import { useState, useEffect, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { offlineStorage, isOnline } from '../lib/offlineStorage';
import { canAnalyzeDream, recordAIUsage, getRemainingAIInterpretations } from '../lib/subscription';
import APIMonitoringDashboard from './APIMonitoringDashboard';
import BadgeNotification from './BadgeNotification';
import StreakPopup from './StreakPopup';
import OfflineIndicator from './OfflineIndicator';
import MorningRitual from './MorningRitual';
import DailyCheckin from './DailyCheckin';
import DreamCalendar from './DreamCalendar';
import PremiumPromptModal from './PremiumPromptModal';

interface SimpleDreamInterfaceProps {
  user?: User | null;
  language?: 'en' | 'ko';
  initialShowHistory?: boolean;
  onHistoryClose?: () => void;
}

// Client-side only PulseDots component to avoid SSR issues
const PulseDots = () => {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);
  
  if (!mounted) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        gap: '8px',
        margin: '20px 0',
        height: '8px'
      }}>
        {[0, 1, 2, 3, 4].map((index) => (
          <div
            key={index}
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              backgroundColor: 'white',
              opacity: '0.3'
            }}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      gap: '8px',
      margin: '20px 0'
    }}>
      {[0, 1, 2, 3, 4].map((index) => (
        <div
          key={index}
          style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            backgroundColor: 'white',
            opacity: '0.3',
            animation: `dotPulse 1.5s ease-in-out infinite`,
            animationDelay: `${index * 0.2}s`
          }}
        />
      ))}
    </div>
  );
};

interface DreamEntry {
  id: string;
  text: string;
  response: string;
  date: string;
  time?: string;
  timestamp: number;
  title?: string;
  image?: string;
  isPrivate?: boolean;
  tags?: string[];
  autoTags?: string[];
  userName?: string; // User's nickname/full_name
}

// Helper function to derive mood from tags
const deriveMoodFromTags = (tags: string[]): string => {
  if (!tags || tags.length === 0) return 'peaceful';

  const tagStr = tags.join(' ').toLowerCase();

  // Check for different emotional states in tags
  if (tagStr.includes('anxious') || tagStr.includes('anxiety') || tagStr.includes('nervous') || tagStr.includes('scared') || tagStr.includes('fear')) {
    return 'anxious';
  }
  if (tagStr.includes('sad') || tagStr.includes('sadness') || tagStr.includes('depressed') || tagStr.includes('melancholy')) {
    return 'melancholic';
  }
  if (tagStr.includes('happy') || tagStr.includes('joy') || tagStr.includes('joyful') || tagStr.includes('excited') || tagStr.includes('excited')) {
    return 'joyful';
  }
  if (tagStr.includes('angry') || tagStr.includes('rage') || tagStr.includes('furious') || tagStr.includes('frustrated')) {
    return 'angry';
  }
  if (tagStr.includes('confused') || tagStr.includes('confusion') || tagStr.includes('puzzled')) {
    return 'confused';
  }
  if (tagStr.includes('calm') || tagStr.includes('peaceful') || tagStr.includes('serene') || tagStr.includes('relaxed')) {
    return 'peaceful';
  }

  // Default to peaceful if no specific mood detected
  return 'peaceful';
};

// Translations
const translations = {
  en: {
    dreamEntry: 'Dream Entry',
    myDream: 'My Dream',
    titlePlaceholder: 'Give your dream a title...',
    listeningVoice: 'Listening for your voice...',
    voiceInProgress: 'Voice recognition in progress...',
    dreamPlaceholder: "Describe your dream in detail, or use keywords separated by commas (e.g., 'flying, water, fear'). Minimum 10 characters.",
    charactersReady: 'Ready',
    brewing: 'Brewing...',
    brew: 'Brew',
    dreamJournal: 'Dream Journal',
    showing: 'Showing',
    of: 'of',
    dreams: 'dreams',
    matching: 'matching',
    taggedWith: 'tagged with',
    searchPlaceholder: 'Search dreams...',
    card: 'Card',
    list: 'List',
    todaysPractice: "Today's Practice",
    cancel: 'Cancel',
    save: 'Save',
    dreamTitle: 'Dream title...',
    describeDream: 'Describe your dream...',
    typeToAddTags: 'Type to add new tags...'
  },
  ko: {
    dreamEntry: '꿈 기록',
    myDream: '나의 꿈',
    titlePlaceholder: '제목',
    listeningVoice: '음성을 듣고 있습니다...',
    voiceInProgress: '음성 인식 진행 중...',
    dreamPlaceholder: '꿈을 자세히 설명하거나 쉼표로 구분한 키워드 입력 (예: 비행, 물, 두려움). 최소 10자 이상 작성해주세요.',
    charactersReady: '준비됨',
    brewing: '분석 중...',
    brew: '분석하기',
    dreamJournal: '드림 저널',
    showing: '표시 중',
    of: '/',
    dreams: '개의 꿈',
    matching: '검색:',
    taggedWith: '태그:',
    searchPlaceholder: '꿈 검색...',
    card: '카드',
    list: '목록',
    todaysPractice: '오늘의 실천',
    cancel: '취소',
    save: '저장',
    dreamTitle: '꿈 제목...',
    describeDream: '꿈을 설명해주세요...',
    typeToAddTags: '새 태그 추가...'
  }
};

export default function SimpleDreamInterface({ user, language = 'en', initialShowHistory = false, onHistoryClose }: SimpleDreamInterfaceProps) {
  const t = translations[language];
  const [isLoading, setIsLoading] = useState(false);
  const [dreamResponse, setDreamResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [dreamText, setDreamText] = useState('');
  const [dreamTitle, setDreamTitle] = useState('');
  const [dreamDate, setDreamDate] = useState<Date>(new Date());
  const [savedDreams, setSavedDreams] = useState<DreamEntry[]>([]);
  const [showHistory, setShowHistory] = useState(initialShowHistory);
  const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);

  // Sync with external history state
  useEffect(() => {
    setShowHistory(initialShowHistory);
  }, [initialShowHistory]);
  const [editingDream, setEditingDream] = useState<DreamEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dreamImage, setDreamImage] = useState<string>('');
  const [viewMode, setViewMode] = useState<'card' | 'calendar'>('card');
  const [editImage, setEditImage] = useState<string>('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAutoTags, setEditAutoTags] = useState<string[]>([]);
  const [newBadge, setNewBadge] = useState<string | null>(null);
  const [showStreakPopup, setShowStreakPopup] = useState(false);
  const [newTag, setNewTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [isRecording, setIsRecording] = useState(false);
  const [showVoiceGuide, setShowVoiceGuide] = useState(false);
  const [hasSeenVoiceGuide, setHasSeenVoiceGuide] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareModalDream, setShareModalDream] = useState<DreamEntry | null>(null);
  const [isOnlineStatus, setIsOnlineStatus] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [remainingAIUsage, setRemainingAIUsage] = useState({ used: 0, limit: 10, remaining: 10, isUnlimited: false });
  const [showPremiumPrompt, setShowPremiumPrompt] = useState(false);
  const [lastSavedDreamId, setLastSavedDreamId] = useState<string>('');
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);
  const recognitionRef = useRef<any>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Load saved dreams from Supabase or localStorage
  useEffect(() => {
    const loadDreams = async () => {
      if (user) {
        // Load from Supabase if logged in
        try {
          const { data, error } = await supabase
            .from('dreams')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

          if (error) {
            console.error('Error loading from Supabase:', error);
            // Fall back to localStorage on error
            const saved = localStorage.getItem('novaDreams');
            if (saved) {
              setSavedDreams(JSON.parse(saved));
            }
          } else if (data) {
            // Get user profile for display
            const { data: profileData } = await supabase
              .from('user_profiles')
              .select('full_name')
              .eq('user_id', user.id)
              .maybeSingle();

            // Convert Supabase dreams to DreamEntry format
            const dreams: DreamEntry[] = data.map((dream: any) => ({
              id: dream.id,
              text: dream.content.split('\n\n---\n\n')[0] || dream.content,
              response: dream.content.split('Analysis:\n')[1] || '',
              title: dream.title,
              date: dream.date,
              time: dream.time,
              timestamp: new Date(dream.created_at).getTime(),
              tags: dream.tags || [],
              autoTags: dream.tags || [],
              image: dream.image || undefined,
              userName: profileData?.full_name || 'Anonymous'
            }));
            setSavedDreams(dreams);
            console.log('Loaded dreams from Supabase:', dreams.length);
          }
        } catch (error) {
          console.error('Exception loading from Supabase:', error);
          // Fall back to localStorage
          const saved = localStorage.getItem('novaDreams');
          if (saved) {
            setSavedDreams(JSON.parse(saved));
          }
        }
      } else {
        // Load from localStorage if not logged in
        const saved = localStorage.getItem('novaDreams');
        if (saved) {
          setSavedDreams(JSON.parse(saved));
        }
      }
    };

    loadDreams();

    // Load premium status and AI usage
    const loadPremiumStatus = async () => {
      if (user) {
        try {
          // Check if user has active premium subscription
          const { data: subscription } = await supabase
            .from('user_subscriptions')
            .select(`
              *,
              subscription_plans:plan_id(
                plan_slug,
                ai_interpretations_per_month
              )
            `)
            .eq('user_id', user.id)
            .eq('status', 'active')
            .maybeSingle();

          console.log('🔍 Premium status check:', {
            userID: user.id,
            hasSubscription: !!subscription,
            subscriptionData: subscription ? {
              status: subscription.status,
              plan: subscription.subscription_plans?.plan_slug,
              ai_limit: subscription.subscription_plans?.ai_interpretations_per_month
            } : null
          });

          const isPremiumUser = subscription && subscription.subscription_plans?.plan_slug === 'premium';
          setIsPremium(isPremiumUser || false);

          console.log('✅ isPremium set to:', isPremiumUser || false);

          // Load AI usage
          const usage = await getRemainingAIInterpretations(user.id);
          setRemainingAIUsage(usage);

          console.log('📊 AI usage loaded:', usage);
        } catch (error) {
          console.error('Error loading premium status:', error);
        }
      }
    };
    loadPremiumStatus();

    // Check if user has seen voice guide
    const seenGuide = localStorage.getItem('hasSeenVoiceGuide');
    if (seenGuide) {
      setHasSeenVoiceGuide(true);
    }
  }, [user]);

  // Initialize offline storage and sync offline dreams
  useEffect(() => {
    const initOfflineStorage = async () => {
      try {
        await offlineStorage.init();
        console.log('Offline storage initialized');

        // Check if we're online
        const online = isOnline();
        setIsOnlineStatus(online);

        // If online and user is logged in, sync offline dreams
        if (online && user) {
          const unsyncedDreams = await offlineStorage.getUnsyncedDreams();
          console.log('Unsynced dreams found:', unsyncedDreams.length);

          if (unsyncedDreams.length > 0) {
            // Sync each unsynced dream
            for (const dream of unsyncedDreams) {
              try {
                await supabase.from('dreams').insert([{
                  user_id: user.id,
                  title: dream.title,
                  content: dream.content,
                  mood: dream.mood,
                  tags: dream.tags,
                  date: dream.date,
                  time: dream.time
                }]);

                // Mark as synced
                await offlineStorage.markAsSynced(dream.id);
                console.log('Synced dream:', dream.id);
              } catch (err) {
                console.error('Error syncing dream:', err);
              }
            }
          }
        }
      } catch (err) {
        console.error('Error initializing offline storage:', err);
      }
    };

    initOfflineStorage();
  }, [user]);

  // Listen for online/offline status changes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleOnline = async () => {
      console.log('Online status changed: online');
      setIsOnlineStatus(true);

      // Auto-analyze unanalyzed offline dreams when coming back online
      if (user) {
        try {
          console.log('Checking for unanalyzed dreams...');
          const allDreams = await offlineStorage.getAllDreams();

          // Find dreams that were saved offline without analysis
          // (dreams with "Analysis unavailable" in response or empty response)
          const dreamsToAnalyze = savedDreams.filter(dream =>
            !dream.response ||
            dream.response.includes('Analysis unavailable') ||
            dream.response.includes('AI service')
          );

          console.log('Found unanalyzed dreams:', dreamsToAnalyze.length);

          if (dreamsToAnalyze.length > 0) {
            // Auto-analyze the first unanalyzed dream
            // (to avoid overwhelming the API)
            const dreamToAnalyze = dreamsToAnalyze[0];
            console.log('Auto-analyzing dream:', dreamToAnalyze.id);

            try {
              const result = await analyzeDreamWithGemini(dreamToAnalyze.text);
              console.log('Auto-analysis completed:', result);

              // Update the dream with the new analysis
              const updatedDreams = savedDreams.map(d =>
                d.id === dreamToAnalyze.id
                  ? { ...d, response: result.analysis, autoTags: result.autoTags || [] }
                  : d
              );
              setSavedDreams(updatedDreams);

              // Save updated dream to Supabase
              try {
                const { error } = await supabase
                  .from('dreams')
                  .update({
                    content: `${dreamToAnalyze.text}\n\n---\n\nAnalysis:\n${result.analysis}`,
                    tags: [...(result.autoTags || []), ...(dreamToAnalyze.tags || [])]
                  })
                  .eq('id', dreamToAnalyze.id)
                  .eq('user_id', user.id);

                if (error) {
                  console.error('Error updating dream with analysis:', error);
                } else {
                  console.log('Dream updated with analysis on Supabase');
                }
              } catch (err) {
                console.error('Error updating dream on Supabase:', err);
              }
            } catch (analysisErr) {
              console.error('Error during auto-analysis:', analysisErr);
            }
          }
        } catch (err) {
          console.error('Error checking for unanalyzed dreams:', err);
        }
      }
    };

    const handleOffline = () => {
      console.log('Online status changed: offline');
      setIsOnlineStatus(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [user, savedDreams]);

  // Check microphone permission status
  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.permissions) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((result) => {
          console.log('Microphone permission status:', result.state);
        })
        .catch(() => {
          console.log('Permission query not supported');
        });
    }
  }, []);

  // Initialize speech recognition
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'ko' ? 'ko-KR' : 'en-US';
        
        recognition.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          setDreamText(transcript);
          setIsRecording(false);
        };
        
        recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          setIsRecording(false);
        };
        
        recognition.onend = () => {
          setIsRecording(false);
        };
        
        recognitionRef.current = recognition;
      }
    }
  }, [language]);

  // Preload matcha images
  useEffect(() => {
    const img1 = new Image();
    const img2 = new Image();
    img1.src = '/matcha-frame1.png';
    img2.src = '/matcha-frame2.png';
  }, []);


  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = () => {
      setActiveMenu(null);
    };
    
    if (activeMenu) {
      document.addEventListener('click', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [activeMenu]);

  // Save dreams to localStorage
  const saveDream = (dreamText: string, response: string) => {
    saveDreamWithTags(dreamText, response, []);
  };

  const saveDreamWithTags = async (dreamText: string, response: string, autoTags: string[], keywords: any[] = []) => {
    console.log('saveDreamWithTags called with:', { dreamText, response, autoTags, keywords, dreamDate });

    // Get user's nickname for display
    let userNickname = '';
    if (user) {
      try {
        const { data: profileData } = await supabase
          .from('user_profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .maybeSingle();

        userNickname = profileData?.full_name || user.email || 'Anonymous';
        console.log('User nickname fetched:', userNickname);
      } catch (err) {
        console.error('Error fetching user nickname:', err);
        userNickname = user.email || 'Anonymous';
      }
    }

    // If this is the first dream and no image is selected, use default image
    const isFirstDream = savedDreams.length === 0;
    const defaultImage = isFirstDream && !dreamImage ? '/Default-dream.png' : dreamImage;

    const now = new Date();
    // Use the selected dream date, not the current time
    const dreamDateToSave = dreamDate || now;
    const newDream: DreamEntry = {
      id: Date.now().toString(),
      text: dreamText,
      response: response,
      title: dreamTitle || t.dreamEntry,
      image: defaultImage || undefined,
      autoTags: autoTags,
      tags: [], // Empty manual tags initially
      date: dreamDateToSave.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      time: dreamDateToSave.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      }),
      timestamp: Date.now()
    };

    console.log('Created newDream object with tags:', newDream);

    // Save to Supabase if user is logged in
    if (user) {
      const online = isOnline();

      // If offline, save to IndexedDB
      if (!online) {
        console.log('Offline detected - saving to IndexedDB');
        try {
          await offlineStorage.saveDream({
            id: newDream.id,
            user_id: user.id,
            title: newDream.title || t.dreamEntry,
            content: `${dreamText}\n\n---\n\nAnalysis:\n${response}`,
            mood: deriveMoodFromTags(autoTags),
            tags: [...autoTags, ...(newDream.tags || [])],
            date: newDream.date,
            time: newDream.time || '',
            created_at: now.toISOString()
          } as any); // Cast to any to handle user_nickname not being in OfflineDream interface

          const updatedDreams = [newDream, ...savedDreams];
          setSavedDreams(updatedDreams);
          console.log('Dream saved to offline storage');

          // Generate daily intentions even in offline mode
          if (user && newDream.id) {
            console.log('⏱️  Scheduling intention generation in 500ms (offline mode)...');
            setTimeout(async () => {
              console.log('🚀 Starting intention generation for offline dream:', newDream.id);
              const result = await generateDailyIntention(response, dreamText, newDream.id);
              if (result) {
                console.log('✅ Intention generation completed successfully (offline)');
              } else {
                console.warn('⚠️  Intention generation did not return data (offline)');
              }
            }, 500);
          }

          return; // Exit early - don't try Supabase
        } catch (err) {
          console.error('Error saving to offline storage:', err);
        }
      }

      // Save to Supabase (online mode)
      try {
        console.log('About to save dream to Supabase with user_id:', user.id);
        console.log('Dream data:', {
          title: newDream.title,
          content: dreamText.substring(0, 100) + '...',
          mood: deriveMoodFromTags(autoTags),
          tags: [...autoTags, ...(newDream.tags || [])],
          date: newDream.date,
          created_at: new Date().toISOString()
        });

        const { data, error } = await supabase
          .from('dreams')
          .insert([{
            user_id: user.id,
            title: newDream.title,
            content: `${dreamText}\n\n---\n\nAnalysis:\n${response}`,
            mood: deriveMoodFromTags(autoTags), // Derive mood from tags
            tags: [...autoTags, ...(newDream.tags || [])],
            date: newDream.date,
            time: newDream.time,
            image: defaultImage || undefined,
            created_at: now.toISOString()
          }])
          .select()
          .single();

        if (error) {
          console.error('Supabase insert failed!');
          console.error('Error saving to Supabase:', error);
          console.error('Error details:', error.message, error.details, error.hint);
          console.error('Error code:', error.code);
          console.error('User ID was:', user.id);

          // Fall back to offline storage on error
          try {
            await offlineStorage.saveDream({
              id: newDream.id,
              user_id: user.id,
              title: newDream.title || t.dreamEntry,
              content: `${dreamText}\n\n---\n\nAnalysis:\n${response}`,
              mood: deriveMoodFromTags(autoTags),
              tags: [...autoTags, ...(newDream.tags || [])],
              date: newDream.date,
              time: newDream.time || '',
              created_at: now.toISOString()
            } as any);
          } catch (offlineErr) {
            console.error('Error saving to offline storage:', offlineErr);
          }

          const updatedDreams = [newDream, ...savedDreams];
          setSavedDreams(updatedDreams);
          localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
        } else {
          console.log('✅ Dream saved to Supabase successfully!');
          console.log('Saved dream ID:', data?.id);
          console.log('Dream data returned:', data);

          // Save keywords to dream_keywords table
          if (keywords && keywords.length > 0) {
            const keywordRecords = keywords.map(kw => ({
              user_id: user.id,
              dream_id: data.id,
              keyword: kw.keyword,
              category: kw.category,
              sentiment: kw.sentiment,
              confidence: 0.8 // Default confidence
            }));

            const { error: keywordError } = await supabase
              .from('dream_keywords')
              .insert(keywordRecords);

            if (keywordError) {
              console.error('Error saving keywords:', keywordError);
            } else {
              console.log('✅ Keywords saved successfully:', keywordRecords.length);
            }
          }

          // Update local state with Supabase ID
          const dreamWithSupabaseId = { ...newDream, id: data.id };
          const updatedDreams = [dreamWithSupabaseId, ...savedDreams];
          setSavedDreams(updatedDreams);
          setLastSavedDreamId(data.id);
          console.log('✅ Local state updated. Total dreams:', updatedDreams.length);

          // Generate daily intentions after saving dream
          if (user && data.id) {
            console.log('✅ Dream saved with ID:', data.id);
            // Generate intentions with a small delay to ensure dream is saved
            console.log('⏱️  Scheduling intention generation in 500ms...');
            setTimeout(async () => {
              console.log('🚀 Starting intention generation for dream:', data.id);
              const result = await generateDailyIntention(response, dreamText, data.id);
              if (result) {
                console.log('✅ Intention generation completed successfully');
              } else {
                console.warn('⚠️  Intention generation did not return data');
              }
            }, 500);
          } else {
            console.warn('⚠️  Cannot generate intentions: user=', !!user, 'data.id=', data?.id);
          }
        }
      } catch (error) {
        console.error('Exception saving to Supabase:', error);
        // Fall back to localStorage
        const updatedDreams = [newDream, ...savedDreams];
        setSavedDreams(updatedDreams);
        localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
      }
    } else {
      // Save to localStorage if not logged in
      const updatedDreams = [newDream, ...savedDreams];
      console.log('Updated dreams array:', updatedDreams);
      setSavedDreams(updatedDreams);
      localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
      console.log('Saved to localStorage and updated state');
    }

    // Check for badges after saving (with delay to allow DB update)
    if (user) {
      setTimeout(() => {
        checkAndAwardBadges(user.id);
      }, 2000); // Increased delay to 2 seconds to ensure DB is updated
      // Show streak popup after dream is saved
      setShowStreakPopup(true);
    }
  };

  // Check and award badges based on dream count
  const checkAndAwardBadges = async (userId: string) => {
    try {
      // Get total dream count
      const { count, error: countError } = await supabase
        .from('dreams')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (countError) {
        console.error('Error counting dreams:', countError);
        return;
      }

      const dreamCount = count || 0;
      console.log('Total dream count:', dreamCount);

      // Get user's current badges
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching badges:', profileError);
        return;
      }

      let currentBadges = [];
      if (profileData?.badges) {
        if (Array.isArray(profileData.badges)) {
          currentBadges = profileData.badges;
        } else if (typeof profileData.badges === 'string') {
          try {
            currentBadges = JSON.parse(profileData.badges);
          } catch {
            currentBadges = [];
          }
        }
      }
      console.log('Current badges:', currentBadges);

      // Define badge thresholds
      const badgeThresholds = [
        { count: 1, badge: 'first_record' },
        { count: 3, badge: '3_records' },
        { count: 7, badge: '7_records' },
        { count: 30, badge: '30_records' }
      ];

      // Check which new badge should be awarded
      let newBadgeAwarded: string | null = null;
      for (const threshold of badgeThresholds) {
        if (dreamCount >= threshold.count && !currentBadges.includes(threshold.badge)) {
          newBadgeAwarded = threshold.badge;

          // Add badge to user profile
          const updatedBadges = [...currentBadges, threshold.badge];
          const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ badges: updatedBadges })
            .eq('user_id', userId);

          if (updateError) {
            console.error('Error updating badges:', updateError);
          } else {
            console.log('Badge awarded:', threshold.badge);
            // Show badge notification
            setNewBadge(threshold.badge);
          }
          break; // Award only one badge at a time
        }
      }
    } catch (error) {
      console.error('Error checking badges:', error);
    }
  };

  // Smoke-like turbulence animation (pauses when modal is open)
  useEffect(() => {
    let frame = 0;
    let animationId: number;

    const animateSmoke = () => {
      try {
        // Pause animation when Dream Journal modal or response modal is open
        if (showHistory || showResponse || selectedDream || editingDream) {
          animationId = requestAnimationFrame(animateSmoke);
          return;
        }

        if (turbulenceRef.current) {
          const time = frame * 0.002;
          // Create upward flowing smoke motion
          const smokeX = 0.012 + Math.sin(time * 0.8) * 0.005;
          const smokeY = 0.018 + Math.cos(time * 0.6) * 0.008 + Math.sin(time * 1.2) * 0.003;

          turbulenceRef.current.setAttribute("baseFrequency", `${smokeX} ${smokeY}`);

          // Animate smoke distort filter
          const smokeFilter = document.querySelector('#smoke-distort feTurbulence');
          if (smokeFilter) {
            const smokeFreqX = 0.02 + Math.cos(time * 0.7) * 0.008;
            const smokeFreqY = 0.08 + Math.sin(time * 0.9) * 0.015;
            smokeFilter.setAttribute("baseFrequency", `${smokeFreqX} ${smokeFreqY}`);
          }
        }
        frame++;
        animationId = requestAnimationFrame(animateSmoke);
      } catch (error) {
        console.error('Animation error:', error);
      }
    };

    // Start animation after a short delay to ensure DOM is ready
    const timeoutId = setTimeout(() => {
      animateSmoke();
    }, 100);

    return () => {
      clearTimeout(timeoutId);
      if (animationId) {
        cancelAnimationFrame(animationId);
      }
    };
  }, [showHistory, showResponse, selectedDream, editingDream]);



  const handleAnalyze = async () => {
    setShowInput(true);
  };

  const startVoiceRecording = () => {
    if (recognitionRef.current) {
      setIsRecording(true);
      setShowInput(true);
      recognitionRef.current.start();
    } else {
      alert('Voice recognition is not supported in this browser.');
    }
  };

  const handleOrbMouseDown = () => {
    longPressTimerRef.current = setTimeout(() => {
      if (!hasSeenVoiceGuide) {
        setShowVoiceGuide(true);
        return;
      }
      startVoiceRecording();
    }, 800); // 0.8 second long press
  };

  const handleOrbMouseUp = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
      
      // Short click
      if (!hasSeenVoiceGuide) {
        setShowVoiceGuide(true);
        return;
      }
      handleAnalyze();
    }
  };

  const handleOrbMouseLeave = () => {
    if (longPressTimerRef.current) {
      clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  };

  // Client-side retry utility
  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  const retryApiCall = async (fn: () => Promise<Response>, maxRetries = 3, baseDelay = 1000): Promise<Response> => {
    let lastError: Error | null = null;
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const response = await fn();
        
        // If it's a server error (503, 502, 500) or rate limit (429), we should retry
        if (response.status >= 500 || response.status === 429) {
          if (attempt === maxRetries) {
            return response; // Return the last response so we can handle the error properly
          }
          
          // Calculate delay with exponential backoff
          const delay = baseDelay * Math.pow(2, attempt);
          const jitter = Math.random() * 0.1 * delay;
          const totalDelay = Math.min(delay + jitter, 10000); // Max 10 seconds
          
          console.log(`Attempt ${attempt + 1} failed with status ${response.status}, retrying in ${Math.round(totalDelay)}ms...`);
          await sleep(totalDelay);
          continue;
        }
        
        return response;
      } catch (error) {
        lastError = error as Error;
        
        if (attempt === maxRetries) {
          throw error;
        }
        
        const delay = baseDelay * Math.pow(2, attempt);
        const jitter = Math.random() * 0.1 * delay;
        const totalDelay = Math.min(delay + jitter, 10000);
        
        console.log(`Network error on attempt ${attempt + 1}, retrying in ${Math.round(totalDelay)}ms...`);
        await sleep(totalDelay);
      }
    }
    
    // This shouldn't happen, but TypeScript needs this
    throw lastError || new Error('Maximum retries exceeded');
  };

  const analyzeDreamWithGemini = async (dreamText: string) => {
    console.log('Starting dream analysis for:', dreamText);
    console.log('🔑 Current isPremium state:', isPremium);
    const startTime = Date.now();

    try {
      // Add a 60-second timeout for the entire analysis operation
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => {
          console.error('Dream analysis timeout exceeded - forcing completion after 60s');
          reject(new Error('The AI service is taking too long to respond. Please try again.'));
        }, 60000); // 60 seconds timeout
      });

      const analysisPromise = (async () => {
        console.log('Fetching dream analysis from API...');
        console.log('📤 Sending isPremium:', isPremium);
        const fetchStart = Date.now();
        const response = await retryApiCall(() =>
          fetch('/api/analyze-dream', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              dreamText: dreamText,
              language: language,
              isPremium: isPremium
            })
          }),
          5, // 5 retries
          2000 // 2 second base delay
        );
        const fetchEnd = Date.now();
        console.log(`API fetch completed in ${fetchEnd - fetchStart}ms`);

        console.log('Response status:', response.status);
        console.log('Response ok:', response.ok);

        // API 호출 결과를 로컬스토리지에 기록 (에러만)
        if (!response.ok) {
          const responseTime = Date.now() - startTime;
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));

          try {
            const errorLog = {
              timestamp: new Date().toISOString(),
              endpoint: '/api/analyze-dream',
              status: response.status,
              error: errorData.error || 'Unknown error',
              responseTime
            };

            const existing = localStorage.getItem('api-errors') || '[]';
            const errors = JSON.parse(existing);
            errors.push(errorLog);

            // 최근 100개 에러만 저장
            const recentErrors = errors.slice(-100);
            localStorage.setItem('api-errors', JSON.stringify(recentErrors));
          } catch (storageError) {
            console.error('Failed to log error to storage:', storageError);
          }
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
          console.log('ERROR RESPONSE DETAILS:', JSON.stringify(errorData, null, 2));
          console.log('Full error object:', errorData);

          // Provide user-friendly error messages
          let userMessage = errorData.error || 'Unknown error occurred';

          if (response.status === 503) {
            userMessage = 'The AI service is experiencing high demand. Please try again in a few moments.';
          } else if (response.status === 429) {
            userMessage = 'Too many requests. Please wait a moment before trying again.';
          } else if (response.status === 502) {
            userMessage = 'The AI service is temporarily unavailable. Please try again shortly.';
          } else if (response.status >= 500) {
            userMessage = 'The AI service is experiencing technical difficulties. Please try again later.';
          }

          throw new Error(userMessage);
        }

        const data = await response.json();
        console.log('Dream analysis successful');

        if (data.analysis) {
          console.log('Analysis result:', data.analysis);
          console.log('Auto tags:', data.autoTags);
          return data;
        } else {
          console.log('Invalid response structure:', data);
          throw new Error('The AI service returned an unexpected response. Please try again.');
        }
      })();

      return await Promise.race([analysisPromise, timeoutPromise]);
    } catch (error) {
      console.error('Dream Analysis Error:', error);
      throw error;
    }
  };

  // Generate daily intentions based on dream analysis and user profile
  const generateDailyIntention = async (dreamAnalysis: string, dreamText: string, dreamId: string) => {
    console.log('Generating daily intention...');

    if (!user) {
      console.log('User not logged in, skipping intention generation');
      return null;
    }

    try {
      // Fetch user profile for personalization
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('occupation, interests, dream_goals')
        .eq('user_id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        return null;
      }

      // Create personalized prompt
      const userContext = profileData ? `
사용자의 직업: ${profileData.occupation || '미지정'}
사용자의 관심사: ${profileData.interests?.join(', ') || '없음'}
사용자의 꿈 목표: ${profileData.dream_goals || '없음'}
      ` : '';

      const prompt = language === 'ko' ? `
당신은 Carl Jung의 심리학과 꿈 해석에 기반한 전문가입니다.

사용자의 꿈: "${dreamText}"

꿈의 분석: ${dreamAnalysis}

${userContext}

이 꿈을 바탕으로 오늘의 확언 ${isPremium ? '3개' : '1개'}를 생성해주세요.

각 확언은:
1. 꿈의 핵심 메시지를 반영
2. 사용자의 직업과 관심사와 연결
3. 오늘 실행 가능한 수준
4. 긍정적이고 행동 지향적

다음 형식으로 정확히 응답해주세요:

${isPremium ? `의도1: [구체적인 확언]
의도2: [구체적인 확언]
의도3: [구체적인 확언]` : `의도: [구체적인 확언]`}

예시:
${isPremium ? `의도1: 오늘 하루 새로운 관점에서 한 가지 문제 살펴보기
의도2: 팀원과 의미 있는 대화 한 번 나누기
의도3: 저녁에 5분이라도 명상이나 산책으로 자신과 연결되기` : `의도: 오늘 하루 새로운 관점에서 한 가지 문제 살펴보기`}
      ` : `
You are an expert in Carl Jung's psychology and dream interpretation.

User's Dream: "${dreamText}"

Dream Analysis: ${dreamAnalysis}

${userContext}

Based on this dream, generate ${isPremium ? '3' : '1'} daily affirmation(s) for today.

Each affirmation should:
1. Reflect the core message of the dream
2. Connect to the user's occupation and interests
3. Be achievable within one day
4. Be positive and action-oriented

Respond in this exact format:

${isPremium ? `Intention1: [specific affirmation]
Intention2: [specific affirmation]
Intention3: [specific affirmation]` : `Intention: [specific affirmation]`}

Example:
${isPremium ? `Intention1: Look at one problem from a new perspective today
Intention2: Have one meaningful conversation with a colleague
Intention3: Spend 5 minutes in the evening connecting with yourself through meditation or walking` : `Intention: Look at one problem from a new perspective today`}
      `;

      // Call Gemini API
      console.log('🤖 Calling Gemini API for intention generation...');
      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dreamText: prompt,
          language: language
        })
      });

      if (!response.ok) {
        console.error('❌ API Error:', response.status, response.statusText);
        console.error('API response body:', await response.text());
        return null;
      }

      const data = await response.json();
      const intentionText = data.analysis || '';

      console.log('✅ API Response received');
      console.log('Intention text length:', intentionText.length);
      console.log('Intention text sample:', intentionText.substring(0, 200));

      // Parse intentions from response
      const parseIntentions = (text: string) => {
        console.log('Parsing intentions from text...');
        const lines = text.split('\n').filter(line => line.trim());
        console.log('Total lines:', lines.length);
        const intentions = [];

        for (const line of lines) {
          if (line.includes('의도') || line.includes('Intention')) {
            console.log('Found intention line:', line);
            const match = line.match(/[^:]*:\s*(.+)/);
            if (match && match[1]) {
              intentions.push(match[1].trim());
            }
          }
        }

        console.log('Parsed intentions count:', intentions.length);
        // Get 1 for free users, 3 for premium
        const maxIntentions = isPremium ? 3 : 1;
        return intentions.slice(0, maxIntentions);
      };

      const intentions = parseIntentions(intentionText);
      const targetCount = isPremium ? 3 : 1;

      // Ensure we have the right number of intentions
      while (intentions.length < targetCount) {
        intentions.push(language === 'ko' ? '오늘 한 가지 작은 좋은 일 하기' : 'Do one small good thing today');
      }

      console.log('✅ Final intentions:', intentions);

      // Save to Supabase
      console.log('💾 Saving intentions to Supabase for user:', user.id, 'dream:', dreamId);
      const { data: intentionData, error: intentionError } = await supabase
        .from('daily_intentions')
        .insert([{
          user_id: user.id,
          dream_id: dreamId,
          intention_1: intentions[0],
          intention_2: intentions[1],
          intention_3: intentions[2],
          full_intention_text: intentionText,
          date: new Date().toISOString().split('T')[0]
        }])
        .select()
        .single();

      if (intentionError) {
        console.error('❌ Error saving intentions to Supabase:', intentionError);
        console.error('Error details:', intentionError.message, intentionError.details);
        return null;
      }

      console.log('✅ Intentions saved successfully to Supabase');
      console.log('Intention data:', intentionData);
      return intentionData;
    } catch (error) {
      console.error('Error in generateDailyIntention:', error);
      return null;
    }
  };

  const handleSubmitDream = async () => {
    const trimmedText = dreamText.trim();

    // Basic length check
    if (!trimmedText || trimmedText.length < 10) {
      alert('Please describe your dream in more detail. Minimum 10 characters required.');
      return;
    }

    // Check for meaningful content (not just repeated characters)
    const uniqueChars = new Set(trimmedText.replace(/\s/g, '').toLowerCase()).size;
    if (uniqueChars < 3) {
      alert('Please write a meaningful dream description with different words.');
      return;
    }

    // Check for actual words (at least 2 words with 2+ characters each)
    const words = trimmedText.split(/\s+/).filter(word => word.length >= 2);
    if (words.length < 2) {
      alert('Please describe your dream with at least a few words. Tell us what happened!');
      return;
    }

    setIsLoading(true);
    setShowInput(false); // Close input modal immediately
    setShowResponse(true); // Show analysis modal immediately with loading state
    setDreamResponse(''); // Clear previous response

    try {
      // If offline, skip analysis and save dream with a message
      if (!isOnlineStatus) {
        console.log('Offline mode: Skipping analysis');
        const offlineMessage = language === 'ko'
          ? '오프라인 모드입니다. 꿈이 저장되었으며, 인터넷 연결 시 자동으로 분석됩니다.'
          : 'You are in offline mode. Your dream has been saved and will be analyzed automatically when you go online.';

        setDreamResponse(offlineMessage);
        saveDreamWithTags(dreamText, offlineMessage, []); // Save without analysis
        setDreamText(''); // Reset dream text
        setDreamTitle(''); // Reset dream title
        setDreamDate(new Date()); // Reset dream date to today
        setDreamImage(''); // Reset dream image
        return;
      }

      // Check AI usage limit before analyzing
      if (user) {
        const canAnalyze = await canAnalyzeDream(user.id);
        if (!canAnalyze.allowed) {
          const limitMessage = language === 'ko'
            ? `이번 달 AI 해석 한도에 도달했습니다 (${canAnalyze.limit}회/월). 프리미엄으로 업그레이드하면 무제한 해석이 가능합니다.`
            : `You've reached your monthly AI interpretation limit (${canAnalyze.limit}/month). Upgrade to Premium for unlimited interpretations.`;

          setDreamResponse(limitMessage);
          // Still save the dream without analysis
          const noAnalysisMsg = language === 'ko'
            ? '한도 초과로 인해 AI 분석 없이 저장되었습니다.'
            : 'Saved without AI analysis due to limit exceeded.';
          saveDreamWithTags(dreamText, noAnalysisMsg, []);
          setDreamText('');
          setDreamTitle('');
          setDreamDate(new Date()); // Reset dream date to today
          setDreamImage('');
          return;
        }

        console.log(`AI interpretations remaining: ${canAnalyze.remaining}/${canAnalyze.limit}`);
      }

      const result = await analyzeDreamWithGemini(dreamText);

      // Record the AI usage after successful analysis
      if (user) {
        await recordAIUsage(user.id, undefined, 'full_analysis');
      }
      console.log('Analysis received in handleSubmitDream:', result);
      setDreamResponse(result.analysis);
      console.log('About to save dream with analysis:', { dreamText, result });
      saveDreamWithTags(dreamText, result.analysis, result.autoTags || [], result.keywords || []); // Save dream with tags and keywords

      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
      setDreamDate(new Date()); // Reset dream date to today
      setDreamImage(''); // Reset dream image
    } catch (error) {
      console.error('Error during dream analysis:', error);

      // Use the user-friendly error message from the API or a default fallback
      const errorMessage = error instanceof Error ? error.message : "Dream analysis temporarily unavailable. Please try again later.";

      setDreamResponse(errorMessage);
      saveDreamWithTags(dreamText, `Analysis unavailable: ${errorMessage}`, []); // Save the dream even on error
      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
      setDreamDate(new Date()); // Reset dream date to today
      setDreamImage(''); // Reset dream image
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setDreamImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleEditImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setEditImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startEditDream = (dream: DreamEntry) => {
    setEditingDream(dream);
    setEditTitle(dream.title || t.dreamEntry);
    setEditText(dream.text);
    setEditImage(dream.image || '');
    setEditTags(dream.tags || []);
    setEditAutoTags(dream.autoTags || []);
    setNewTag('');
    setSelectedDream(null); // Close detail modal
  };

  const saveEditDream = () => {
    if (!editingDream) return;
    
    const updatedDreams = savedDreams.map(dream => 
      dream.id === editingDream.id 
        ? { 
            ...dream, 
            title: editTitle || t.dreamEntry, 
            text: editText, 
            image: editImage || undefined,
            tags: editTags,
            autoTags: editAutoTags
          }
        : dream
    );
    
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    
    // Reset edit state
    setEditingDream(null);
    setEditTitle('');
    setEditText('');
    setEditImage('');
    setEditTags([]);
    setEditAutoTags([]);
    setNewTag('');
  };

  const cancelEditDream = () => {
    setEditingDream(null);
    setEditTitle('');
    setEditText('');
    setEditImage('');
    setEditTags([]);
    setEditAutoTags([]);
    setNewTag('');
  };

  const deleteDream = async (dreamId: string) => {
    // Delete from Supabase if user is logged in
    if (user) {
      try {
        const { error } = await supabase
          .from('dreams')
          .delete()
          .eq('id', dreamId)
          .eq('user_id', user.id);

        if (error) {
          console.error('Error deleting from Supabase:', error);
          // Still remove from local state
        } else {
          console.log('Deleted from Supabase:', dreamId);
        }
      } catch (error) {
        console.error('Exception deleting from Supabase:', error);
      }
    } else {
      // Delete from localStorage if not logged in
      const updatedDreams = savedDreams.filter(dream => dream.id !== dreamId);
      localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    }

    // Update local state
    const updatedDreams = savedDreams.filter(dream => dream.id !== dreamId);
    setSavedDreams(updatedDreams);
    setActiveMenu(null);
  };

  const [showShareToast, setShowShareToast] = useState(false);

  const shareDream = (dream: DreamEntry, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
    }
    setShareModalDream(dream);
    setShowShareModal(true);
  };

  const handleShareOption = (platform: 'link' | 'instagram' | 'native') => {
    if (!shareModalDream) return;

    const dreamTitle = shareModalDream.title || t.dreamEntry;
    const dreamText = shareModalDream.text.length > 200
      ? shareModalDream.text.substring(0, 200) + '...'
      : shareModalDream.text;

    const shareText = language === 'ko'
      ? `Today's Dream 🌙\n\n${dreamTitle}\n\n${dreamText}\n\nNovakitz로 기록했어요\n${window.location.origin}`
      : `Today's Dream 🌙\n\n${dreamTitle}\n\n${dreamText}\n\nRecorded with Novakitz\n${window.location.origin}`;

    if (platform === 'link') {
      navigator.clipboard.writeText(shareText).then(() => {
        setShowShareToast(true);
        setShowShareModal(false);
        setTimeout(() => setShowShareToast(false), 2000);
      });
    } else if (platform === 'instagram') {
      // Instagram share via web intent
      const instagramShareUrl = `https://www.instagram.com/share?url=${encodeURIComponent(window.location.origin)}&quote=${encodeURIComponent(shareText)}`;
      window.open(instagramShareUrl, '_blank');
      setShowShareModal(false);
    } else if (platform === 'native') {
      if (navigator.share) {
        navigator.share({
          title: dreamTitle,
          text: shareText
        }).catch(err => console.log('Share cancelled', err));
      }
      setShowShareModal(false);
    }
    setActiveMenu(null);
  };


  const addNewTag = () => {
    if (newTag.trim() && !editTags.includes(newTag.trim().toLowerCase())) {
      setEditTags([...editTags, newTag.trim().toLowerCase()]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string, isAutoTag: boolean = false) => {
    if (isAutoTag) {
      setEditAutoTags(editAutoTags.filter(tag => tag !== tagToRemove));
    } else {
      setEditTags(editTags.filter(tag => tag !== tagToRemove));
    }
  };

  // Filter dreams based on search term and selected tag
  const filteredDreams = savedDreams.filter(dream => {
    // Filter out "no dream" markers from card view (only show in calendar)
    const isNoDream = dream.tags?.includes('꿈안꿈') || dream.tags?.includes('no-dream') ||
                      dream.title?.includes('꿈 안 꿈') || dream.title?.includes('No Dream');
    if (isNoDream) return false;

    const matchesSearch = searchTerm === '' ||
      dream.text.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dream.response.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTag = selectedTag === '' ||
      dream.autoTags?.includes(selectedTag) ||
      dream.tags?.includes(selectedTag);

    return matchesSearch && matchesTag;
  });

  // Get all unique tags for filter dropdown
  const allTags = [...new Set([
    ...savedDreams.flatMap(dream => dream.autoTags || []),
    ...savedDreams.flatMap(dream => dream.tags || [])
  ])].sort();

  return (
    <div style={{ position: 'relative', minHeight: '100vh', background: '#e8f5e8' }}>
      {/* Premium Prompt Modal */}
      <PremiumPromptModal
        user={user || null}
        onClose={() => setShowPremiumPrompt(false)}
        language={language}
      />

      {/* Offline Indicator */}
      {!isOnlineStatus && <OfflineIndicator language={language} />}

      <div style={{ position: 'relative', zIndex: 1 }}>
      <style jsx global>{`
        body {
          font-family: ${language === 'ko' ? "'S-CoreDream', -apple-system, BlinkMacSystemFont, sans-serif" : "'Roboto', -apple-system, BlinkMacSystemFont, sans-serif"};
          background: #e8f5e8;
          color: #1f2937;
          overflow-x: hidden;
        }
        
        .nova-logo {
          position: fixed;
          top: 20px;
          left: 20px;
          width: 50px;
          height: 50px;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.15);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 16px;
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 2px 8px rgba(127, 176, 105, 0.2);
          transition: all 0.3s ease;
          cursor: pointer;
        }
        
        .nova-logo:hover {
          background: rgba(255, 255, 255, 0.2);
          border-color: rgba(127, 176, 105, 0.3);
          transform: translateY(-2px);
          box-shadow: 
            0 12px 40px rgba(0, 0, 0, 0.15),
            0 4px 12px rgba(127, 176, 105, 0.3);
        }
        
        .logo-dots {
          position: relative;
          width: 28px;
          height: 28px;
        }
        
        .logo-dot {
          position: absolute;
          width: 5px;
          height: 5px;
          background: linear-gradient(135deg, #7fb069, #a8d5a8);
          border-radius: 50%;
          box-shadow: 
            0 2px 6px rgba(127, 176, 105, 0.4),
            inset 0 1px 0 rgba(255, 255, 255, 0.3);
          animation: logoGlow 3s ease-in-out infinite;
        }
        
        .dot-1 { top: 0; left: 50%; transform: translateX(-50%); animation-delay: 0s; }
        .dot-2 { top: 25%; right: 15%; animation-delay: 0.5s; }
        .dot-3 { bottom: 25%; right: 15%; animation-delay: 1s; }
        .dot-4 { bottom: 0; left: 50%; transform: translateX(-50%); animation-delay: 1.5s; }
        .dot-5 { bottom: 25%; left: 15%; animation-delay: 2s; }
        .dot-6 { top: 25%; left: 15%; animation-delay: 2.5s; }
        
        @keyframes logoGlow {
          0%, 100% { 
            opacity: 0.8; 
            box-shadow: 
              0 2px 6px rgba(127, 176, 105, 0.4),
              inset 0 1px 0 rgba(255, 255, 255, 0.3);
          }
          50% { 
            opacity: 1; 
            box-shadow: 
              0 4px 12px rgba(127, 176, 105, 0.6),
              inset 0 1px 0 rgba(255, 255, 255, 0.4);
          }
        }

        .dream-orb {
          width: 350px;
          height: 350px;
          border-radius: 50%;
          position: relative;
          cursor: pointer;
          transition: transform 0.5s ease, box-shadow 0.5s ease;
          background: linear-gradient(135deg, rgba(127, 176, 105, 0.4), rgba(168, 213, 168, 0.4));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 
            0 8px 32px rgba(127, 176, 105, 0.3),
            0 4px 16px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.4);
          animation: pulse 8s infinite ease-in-out;
          overflow: hidden;
          margin: 0 auto;
          user-select: none;
          -webkit-user-select: none;
          -webkit-touch-callout: none;
          -webkit-tap-highlight-color: transparent;
        }
        
        .orb-motion {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          filter: url(#liquid-motion);
          overflow: hidden;
        }
        
        .smoke-base {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: 
            radial-gradient(ellipse 60% 80% at 50% 100%, 
              #7FB069 0%, 
              #A8D5A8 30%, 
              #F7F3E9 60%, 
              transparent 100%);
        }

        .smoke-layer-1 {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: 
            radial-gradient(ellipse 40% 70% at 45% 90%, 
              rgba(255, 255, 255, 0.8) 0%, 
              rgba(127, 176, 105, 0.4) 40%, 
              transparent 80%);
          animation: smokeRise1 8s ease-out infinite;
          filter: url(#smoke-distort);
        }

        .smoke-layer-2 {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: 
            radial-gradient(ellipse 50% 60% at 55% 85%, 
              rgba(168, 213, 168, 0.6) 0%, 
              rgba(255, 255, 255, 0.3) 50%, 
              transparent 90%);
          animation: smokeRise2 10s ease-out infinite;
          filter: url(#smoke-distort);
        }

        .smoke-layer-3 {
          position: absolute;
          top: 0; left: 0;
          width: 100%; height: 100%;
          background: 
            radial-gradient(ellipse 35% 50% at 50% 80%, 
              rgba(247, 243, 233, 0.7) 0%, 
              rgba(168, 213, 168, 0.4) 60%, 
              transparent 100%);
          animation: smokeRise3 12s ease-out infinite;
          filter: url(#smoke-distort);
        }

        .orb-layer-1 {
          position: absolute;
          top: -5%; left: -5%;
          width: 110%; height: 110%;
          background: 
            radial-gradient(circle at 60% 40%, rgba(255, 255, 255, 0.6) 0%, rgba(127, 176, 105, 0.3) 20%, transparent 50%),
            radial-gradient(circle at 20% 80%, rgba(168, 213, 168, 0.5) 0%, rgba(255, 255, 255, 0.2) 30%, transparent 60%);
          animation: rotate 25s linear infinite;
          mix-blend-mode: overlay;
        }

        .orb-layer-2 {
          position: absolute;
          top: -8%; left: -8%;
          width: 116%; height: 116%;
          background: 
            linear-gradient(45deg, 
              rgba(255, 255, 255, 0.4) 0%,
              rgba(168, 213, 168, 0.3) 25%,
              rgba(127, 176, 105, 0.2) 50%,
              rgba(247, 243, 233, 0.3) 75%,
              rgba(255, 255, 255, 0.4) 100%);
          animation: rotate 35s linear infinite reverse;
          mix-blend-mode: soft-light;
        }

        @keyframes smokeRise1 {
          0% { 
            transform: translateY(0%) scale(1) rotate(0deg);
            opacity: 0;
          }
          20% {
            transform: translateY(-10%) scale(1.1) rotate(2deg);
            opacity: 0.8;
          }
          40% {
            transform: translateY(-25%) scale(1.3) rotate(-1deg);
            opacity: 0.6;
          }
          60% {
            transform: translateY(-45%) scale(1.6) rotate(3deg);
            opacity: 0.4;
          }
          80% {
            transform: translateY(-70%) scale(2.1) rotate(-2deg);
            opacity: 0.2;
          }
          100% { 
            transform: translateY(-100%) scale(2.5) rotate(1deg);
            opacity: 0;
          }
        }

        @keyframes smokeRise2 {
          0% { 
            transform: translateY(0%) scale(0.8) rotate(0deg);
            opacity: 0;
          }
          15% {
            transform: translateY(-8%) scale(1) rotate(-2deg);
            opacity: 0.6;
          }
          35% {
            transform: translateY(-20%) scale(1.2) rotate(1deg);
            opacity: 0.5;
          }
          55% {
            transform: translateY(-40%) scale(1.5) rotate(-3deg);
            opacity: 0.3;
          }
          75% {
            transform: translateY(-65%) scale(1.9) rotate(2deg);
            opacity: 0.15;
          }
          100% { 
            transform: translateY(-95%) scale(2.3) rotate(-1deg);
            opacity: 0;
          }
        }

        @keyframes smokeRise3 {
          0% { 
            transform: translateY(0%) scale(0.9) rotate(0deg);
            opacity: 0;
          }
          25% {
            transform: translateY(-12%) scale(1.1) rotate(3deg);
            opacity: 0.7;
          }
          45% {
            transform: translateY(-30%) scale(1.4) rotate(-1deg);
            opacity: 0.5;
          }
          65% {
            transform: translateY(-55%) scale(1.8) rotate(2deg);
            opacity: 0.3;
          }
          85% {
            transform: translateY(-80%) scale(2.2) rotate(-2deg);
            opacity: 0.1;
          }
          100% { 
            transform: translateY(-110%) scale(2.6) rotate(1deg);
            opacity: 0;
          }
        }

        @keyframes rotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 640px) {
          .dream-orb {
            width: 280px;
            height: 280px;
          }
        }
        
        .dream-orb:hover {
          transform: scale(1.05);
        }
        
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        
        .matcha-gradient-text {
          background: linear-gradient(90deg, #5A8449, #7FB069);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
        }
        
        .matcha-btn {
          background-color: #7FB069;
          color: white;
          transition: all 0.3s ease;
          box-shadow: 0 4px 15px 0 rgba(127, 176, 105, 0.5);
        }
        
        .matcha-btn:hover {
          background-color: #5A8449;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px 0 rgba(90, 132, 73, 0.6);
        }
        
        .matcha-btn:disabled {
          background-color: #a8d5a8;
          cursor: not-allowed;
          transform: translateY(0);
          box-shadow: none;
        }
        
        .glass-pane {
          background: rgba(255, 255, 255, 0.25);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border-radius: 24px;
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 
            0 8px 32px rgba(0, 0, 0, 0.12),
            0 4px 16px rgba(255, 255, 255, 0.1),
            inset 0 1px 0 rgba(255, 255, 255, 0.6);
        }
        
        .fade-in {
          animation: fadeIn 1.5s ease-out forwards;
        }
        
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        
        .spinner {
          border: 4px solid rgba(0, 0, 0, 0.1);
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border-left-color: #7FB069;
          animation: spin 1s ease infinite;
        }
        
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        .orb-text {
          background: transparent;
          text-shadow: 
            0 0 10px rgba(0,0,0,0.9),
            0 0 20px rgba(0,0,0,0.8),
            2px 2px 4px rgba(0,0,0,0.7),
            -2px -2px 4px rgba(0,0,0,0.7);
          font-weight: 900;
        }
        
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
          overflow: visible !important;
        }
        
        .modal-content {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 480px;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }
        
        .modal-header {
          padding: 24px 24px 16px 24px;
          border-bottom: none;
        }
        
        .modal-header {\n          padding: 24px 24px 8px 24px;\n          border-bottom: 1px solid #f1f5f9;\n        }\n        \n        .modal-body {
          padding: 16px 24px 24px 24px;
        }
        
        .dream-input {
          width: calc(100% - 64px);
          min-height: 120px;
          margin: 0 32px;
          padding: 20px 16px;
          border: none;
          outline: none;
          font-size: 16px;
          font-family: Georgia, serif;
          resize: none;
          background: transparent;
          color: #334155;
          line-height: 1.5;
          box-sizing: border-box;
        }
        
        .dream-input::placeholder {
          color: #94a3b8;
        }
        
        .char-counter {
          font-size: 12px;
          color: #94a3b8;
          text-align: right;
          margin: 8px 32px 0 32px;
        }
        
        .char-counter.sufficient {
          color: #7FB069;
        }
        
        .dream-title-input {
          width: calc(100% - 64px);
          margin: 0 32px 16px 32px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          font-size: 18px;
          font-weight: 600;
          font-family: Georgia, serif;
          background: #f8fafc;
          color: #334155;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        
        .dream-title-input:focus {
          border-color: #7FB069;
          background: white;
          box-shadow: 0 0 0 3px rgba(127, 176, 105, 0.1);
        }
        
        .dream-title-input::placeholder {
          color: #94a3b8;
          font-weight: normal;
        }
        
        .modal-actions {
          padding: 16px 24px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .btn-primary {
          background: #7FB069;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          font-family: Georgia, "Times New Roman", Times, serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-primary:hover {
          background: #5A8449;
        }
        
        .btn-primary:disabled {
          background: #A8D5A8;
          cursor: not-allowed;
        }
        
        .btn-secondary {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          font-family: Georgia, "Times New Roman", Times, serif;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-secondary:hover {
          background: #f1f5f9;
        }
        
        .user-avatar {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: linear-gradient(45deg, #7FB069, #A8D5A8);
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
        }
        
        .loading-dots {
          display: flex;
          gap: 3px;
        }
        
        .loading-dot {
          width: 4px;
          height: 4px;
          background: #ffffff;
          border-radius: 50%;
          animation: loadingPulse 1.4s ease-in-out infinite both;
        }
        
        .loading-dot:nth-child(1) { animation-delay: -0.32s; }
        .loading-dot:nth-child(2) { animation-delay: -0.16s; }
        .loading-dot:nth-child(3) { animation-delay: 0; }
        .loading-dot:nth-child(4) { animation-delay: 0.16s; }
        .loading-dot:nth-child(5) { animation-delay: 0.32s; }
        .loading-dot:nth-child(6) { animation-delay: 0.48s; }
        
        @keyframes loadingPulse {
          0%, 80%, 100% {
            transform: scale(0.8);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: translateY(-20px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        
        .dream-history {
          position: fixed;
          top: 20px;
          left: 20px;
          right: 20px;
          bottom: 20px;
          background: #f8fafc;
          z-index: 2000;
          overflow-y: auto;
          padding: 40px;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        }
        
        .dream-history-container {
          max-width: 1200px;
          margin: 0;
          margin-left: 0;
          position: relative;
          min-height: calc(100vh - 200px);
        }

        .dream-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
          justify-items: start;
        }
        
        .dream-grid-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
          width: 100%;
          max-width: none;
          margin: 0;
          padding: 0 20px;
          align-items: flex-start;
        }


        .dream-grid-list .dream-entry {
          display: flex;
          flex-direction: row;
          align-items: center;
          padding: 12px 16px;
          padding-right: 60px;
          height: 88px;
          position: relative;
          width: auto;
          max-width: 600px;
        }

        .dream-grid-list .dream-entry .dream-image {
          width: 64px;
          height: 64px;
          flex-shrink: 0;
          margin-right: 16px;
          border-radius: 8px;
        }

        .dream-grid-list .dream-entry .dream-content {
          flex: 1;
          overflow: hidden;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 4px;
        }

        .dream-grid-list .dream-entry .dream-title {
          font-size: 18px;
          font-weight: 600;
          margin-bottom: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .dream-grid-list .dream-entry .dream-date {
          font-size: 12px;
          color: #6b7280;
          display: block;
        }

        .dream-grid-list .dream-entry .dream-meta {
          display: none;
        }

        .dream-grid-list .dream-entry .dream-text {
          display: none;
        }

        .dream-grid-list .dream-entry .dream-tags {
          display: none;
        }

        .dream-grid-list .dream-entry {
          position: relative;
        }

        .dream-grid-list .dream-entry .dream-image {
          position: relative;
          pointer-events: none;
        }

        .dream-grid-list .dream-entry > .dream-actions {
          position: absolute !important;
          right: 12px !important;
          top: 50% !important;
          left: auto !important;
          transform: translateY(-50%) !important;
          margin: 0 !important;
          z-index: 10 !important;
          background: transparent !important;
        }

        .dream-grid-list .dream-entry .dots-menu-btn {
          pointer-events: auto !important;
          background: rgba(255, 255, 255, 0.9) !important;
          border-radius: 50% !important;
          width: 32px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1) !important;
        }

        .dream-grid-list .dream-entry .camera-overlay {
          opacity: 0;
          transition: opacity 0.3s ease;
        }

        .dream-grid-list .dream-entry .dream-image:hover .camera-overlay {
          opacity: 1;
        }

        .dream-grid .dream-entry .dream-date {
          display: none;
        }
        @media (max-width: 768px) {
          .dream-grid {
            grid-template-columns: 1fr;
          }
        }
        
        @media (max-width: 1024px) and (min-width: 769px) {
          .dream-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        
        @media (max-width: 1400px) and (min-width: 1025px) {
          .dream-grid {
            grid-template-columns: repeat(3, 1fr);
          }
        }
        
        .journal-close-btn {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          font-weight: 500;
          z-index: 10;
        }
        
        .journal-close-btn:hover {
          background: #e2e8f0;
          color: #475569;
        }
        
        .dream-entry {
          background: white;
          border-radius: 16px;
          overflow: visible;
          box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          cursor: pointer;
          position: relative;
        }
        
        .dream-entry:hover {
          transform: translateY(-2px);
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
        }
        
        .dream-image {
          width: 100%;
          height: 200px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          position: relative;
          overflow: hidden;
          border-radius: 16px 16px 0 0;
          background-size: cover;
          background-position: center;
        }
        
        .camera-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          opacity: 0;
          transition: opacity 0.3s ease;
          cursor: pointer;
        }
        
        .dream-image:hover .camera-overlay {
          opacity: 1;
        }
        
        .camera-icon {
          color: white;
          font-size: 48px;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3);
        }
        
        .dream-actions {
          position: absolute;
          top: 16px;
          right: 16px;
          display: flex;
          gap: 8px;
        }
        
        
        .dream-content {
          padding: 20px;
          text-align: left;
          background: rgba(127, 176, 105, 0.15);
          backdrop-filter: blur(10px);
          border-top: 1px solid rgba(127, 176, 105, 0.3);
        }

        .dream-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
          text-align: left;
        }
        
        .dream-icon {
          font-size: 18px;
        }
        
        .dream-title-text {
          font-size: 18px;
          font-weight: 600;
          color: #1f2937;
        }
        
        .dream-meta {
          font-size: 14px;
          color: #6b7280;
          margin-bottom: 16px;
        }
        
        .dream-text {
          font-size: 16px;
          line-height: 1.6;
          color: #374151;
          font-family: Georgia, serif;
          text-align: left;
        }
        
        .dream-date {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .dream-preview {
          font-family: Georgia, serif;
          color: #334155;
          margin-bottom: 8px;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        
        .dream-detail-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .dream-detail-modal {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }
        
        .dream-detail-header {
          padding: 24px;
          border-bottom: 1px solid #f1f5f9;
          background: linear-gradient(135deg, #7fb069 0%, #a8d5a8 50%, #c3e6cb 100%);
          color: white;
        }
        
        .dream-detail-body {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .dream-detail-title {
          font-size: 24px;
          font-weight: 600;
          margin-bottom: 8px;
        }
        
        .dream-detail-date {
          font-size: 14px;
          opacity: 0.9;
        }
        
        .dream-detail-content {
          font-family: Georgia, serif;
          font-size: 16px;
          line-height: 1.7;
          color: #374151;
          margin-bottom: 24px;
        }
        
        .dream-detail-response {
          background: #f8fafc;
          padding: 20px;
          border-radius: 16px;
          border-left: 4px solid #7FB069;
        }
        
        .dream-detail-response-title {
          font-weight: 600;
          color: #7FB069;
          margin-bottom: 12px;
          font-size: 16px;
        }
        
        .dream-detail-response-text {
          color: #64748b;
          line-height: 1.6;
        }
        
        .dream-detail-close {
          position: absolute;
          bottom: 12px;
          background: rgba(255, 255, 255, 0.3);
          border: none;
          borderRadius: 50%;
          color: white;
          width: 32px;
          height: 32px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
          z-index: 11;
        }

        .dream-detail-close:hover {
          background: rgba(255, 255, 255, 0.3);
        }

        @media (max-width: 640px) {
          .dream-detail-header {
            padding: 16px 12px;
          }

          .dream-detail-close {
            width: 28px;
            height: 28px;
            font-size: 16px;
          }
        }

        @media (max-width: 480px) {
          .dream-detail-header {
            padding: 12px 8px;
          }

          .dream-detail-close {
            width: 26px;
            height: 26px;
            font-size: 14px;
            bottom: 8px;
            right: 8px;
          }
        }
        
        .edit-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          z-index: 3000;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 20px;
        }
        
        .edit-modal-content {
          background: white;
          border-radius: 24px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          width: 100%;
          max-width: 600px;
          max-height: 90vh;
          overflow: hidden;
          animation: modalSlideIn 0.3s ease-out;
        }
        
        .edit-modal-header {
          padding: 24px 24px 16px 24px;
          border-bottom: 1px solid #f1f5f9;
          background: #7FB069;
          color: white;
        }
        
        .edit-modal-body {
          padding: 24px;
          max-height: 60vh;
          overflow-y: auto;
        }
        
        .edit-input {
          width: 100%;
          margin-bottom: 16px;
          padding: 16px;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          outline: none;
          font-size: 16px;
          font-family: Georgia, serif;
          box-sizing: border-box;
          transition: all 0.2s ease;
        }
        
        .edit-input:focus {
          border-color: #7FB069;
          box-shadow: 0 0 0 3px rgba(127, 176, 105, 0.1);
        }
        
        .edit-textarea {
          min-height: 150px;
          resize: vertical;
        }
        
        .edit-actions {
          padding: 16px 24px 24px 24px;
          display: flex;
          gap: 12px;
          justify-content: flex-end;
        }
        
        .btn-save {
          background: #7FB069;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-save:hover {
          background: #5A8449;
        }
        
        .btn-cancel {
          background: #f8fafc;
          color: #64748b;
          border: 1px solid #e2e8f0;
          padding: 10px 20px;
          border-radius: 12px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .btn-cancel:hover {
          background: #f1f5f9;
        }
        
        .image-upload-container {
          margin: 0 32px 16px 32px;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          text-align: center;
          background: #f8fafc;
          transition: all 0.2s ease;
          cursor: pointer;
        }
        
        .image-upload-container:hover {
          border-color: #7FB069;
          background: #f0f9f0;
        }
        
        .image-upload-container.has-image {
          padding: 0;
          border: none;
          background: none;
        }
        
        .uploaded-image {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 12px;
        }
        
        .upload-placeholder {
          color: #94a3b8;
          font-size: 14px;
        }
        
        .upload-input {
          display: none;
        }
        
        .dots-menu-btn {
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.9);
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }
        
        .dots-menu-btn:hover {
          background: white;
          transform: scale(1.1);
        }
        
        .dots-menu {
          position: absolute;
          top: 45px;
          right: 0;
          background: white;
          border-radius: 16px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15);
          border: 1px solid #e2e8f0;
          min-width: 180px;
          z-index: 3000;
          overflow: hidden;
        }
        
        .menu-item {
          width: 100%;
          padding: 12px 16px;
          border: none;
          background: none;
          text-align: left;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 14px;
          color: #374151;
          transition: all 0.2s ease;
        }
        
        .menu-item:hover {
          background: #f8fafc;
        }
        
        .menu-item.danger {
          color: #dc2626;
        }
        
        .menu-item.danger:hover {
          background: #fef2f2;
        }
        
        .menu-icon {
          width: 16px;
          height: 16px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .menu-icon svg {
          width: 16px;
          height: 16px;
          stroke: currentColor;
          fill: none;
          stroke-width: 2;
          stroke-linecap: round;
          stroke-linejoin: round;
        }
        
        .analysis-content {
          font-family: Georgia, serif;
        }
        
        .analysis-section {
          margin-bottom: 24px;
          padding: 0;
        }
        
        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #7FB069;
          margin-bottom: 12px;
          display: flex;
          align-items: center;
          gap: 8px;
          font-family: 'Inter', sans-serif;
        }
        
        .section-text {
          font-size: 16px;
          line-height: 1.7;
          color: #374151;
          margin: 0;
          padding: 16px 20px;
          background: #f8fafc;
          border-radius: 12px;
          border-left: 4px solid #7FB069;
        }
        
        .search-container, .filter-container {
          position: relative;
        }
        
        .search-input, .filter-select {
          background: #f1f5f9;
          color: #64748b;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 8px 16px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          outline: none;
          min-width: 160px;
        }
        
        .search-input:hover, .filter-select:hover {
          background: #e2e8f0;
          color: #475569;
        }
        
        .search-input:focus, .filter-select:focus {
          background: white;
          border-color: #7FB069;
          color: #374151;
          box-shadow: 0 0 0 3px rgba(127, 176, 105, 0.1);
        }
        
        .search-input::placeholder {
          color: #94a3b8;
          font-weight: normal;
        }
        
        .filter-select {
          cursor: pointer;
          appearance: none;
          background-image: url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3e%3c/svg%3e");
          background-position: right 8px center;
          background-repeat: no-repeat;
          background-size: 16px 16px;
          padding-right: 40px;
        }
        
        .loading-container {
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 60px 24px;
          overflow: visible !important;
          width: auto !important;
          height: auto !important;
        }
        
        .loading-analysis {
          text-align: center;
          padding: 40px;
          background: transparent;
          border-radius: 24px;
          overflow: visible !important;
          width: auto;
          min-width: 600px;
        }
        
        .matcha-brewing {
          margin: 0 auto 32px;
          display: flex;
          justify-content: center;
          overflow: visible !important;
          min-height: 450px;
          align-items: center;
          width: 100%;
        }
        
        .custom-matcha-animation {
          position: relative;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        
        .matcha-background-container {
          display: flex;
          justify-content: center;
          align-items: center;
          overflow: visible !important;
        }
        
        .matcha-bg-image {
          filter: drop-shadow(0 10px 20px rgba(127, 176, 105, 0.3));
          overflow: visible !important;
        }
        
        .frame-1 {
          opacity: 1 !important;
        }
        

        @keyframes pulse {
          0% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.5; transform: scale(1.2); }
          100% { opacity: 1; transform: scale(1); }
        }
        
        .loading-georgia-text {
          font-family: Georgia, "Times New Roman", Times, serif !important;
          font-size: 18px !important;
          color: white !important;
          text-align: center !important;
          margin: 20px auto 0 auto !important;
          margin-bottom: 0 !important;
          font-weight: normal !important;
          text-shadow: 0 2px 4px rgba(0,0,0,0.3) !important;
          width: 100% !important;
          display: block !important;
        }
        
        .dream-history-header {
          position: sticky;
          top: 0;
          background: transparent;
          backdrop-filter: none;
          z-index: 10;
          padding: 20px;
          border-radius: 24px 24px 0 0;
        }
        
        .journal-header-controls {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 20px;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(10px);
          border-radius: 0 0 24px 24px;
          margin-top: 20px;
        }
        
        .whisk-animation {
          animation: whiskStirring 1.2s ease-in-out infinite;
          transform-origin: 100px 90px;
        }
        
        .bristles {
          animation: bristleFlexing 1.2s ease-in-out infinite;
        }
        
        .swirl-container {
          animation: swirlRotation 4s linear infinite;
          transform-origin: 100px 150px;
        }
        
        .swirl-1 {
          animation: pathMorph1 3s ease-in-out infinite;
          transform-origin: center;
        }
        
        .swirl-2 {
          animation: pathMorph2 3s ease-in-out infinite 0.5s;
          transform-origin: center;
        }
        
        .liquid-base {
          animation: liquidBubble 2.5s ease-in-out infinite;
        }
        
        .foam-layer {
          animation: foamPulse 2s ease-in-out infinite;
        }
        
        .bubble-group .bubble {
          animation: bubbleRise 2.5s ease-in-out infinite;
        }
        
        .b1 { animation-delay: 0s; }
        .b2 { animation-delay: 0.3s; }
        .b3 { animation-delay: 0.6s; }
        .b4 { animation-delay: 0.9s; }
        .b5 { animation-delay: 1.2s; }
        
        .steam path {
          animation: steamRise 3s ease-in-out infinite;
        }
        
        .steam-1 { animation-delay: 0s; }
        .steam-2 { animation-delay: 0.5s; }
        .steam-3 { animation-delay: 1s; }
        
        @keyframes matchaFrame1 {
          0% { opacity: 1; }
          25% { opacity: 1; }
          50% { opacity: 0; }
          75% { opacity: 0; }
          100% { opacity: 1; }
        }
        
        @keyframes matchaFrame2 {
          0% { opacity: 0; }
          25% { opacity: 0; }
          50% { opacity: 1; }
          75% { opacity: 1; }
          100% { opacity: 0; }
        }
        
        @keyframes whiskStirring {
          0% { transform: rotate(-25deg); }
          25% { transform: rotate(25deg); }
          50% { transform: rotate(-25deg); }
          75% { transform: rotate(25deg); }
          100% { transform: rotate(-25deg); }
        }
        
        @keyframes bristleFlexing {
          0%, 100% { transform: scaleX(1); }
          50% { transform: scaleX(1.1); }
        }
        
        @keyframes swirlRotation {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pathMorph1 {
          0%, 100% { 
            opacity: 0.8;
            transform: scale(1);
          }
          50% { 
            opacity: 0.4;
            transform: scale(1.05);
          }
        }
        
        @keyframes pathMorph2 {
          0%, 100% { 
            opacity: 0.6;
            transform: scale(1) rotate(0deg);
          }
          50% { 
            opacity: 0.3;
            transform: scale(1.1) rotate(1deg);
          }
        }
        
        @keyframes liquidBubble {
          0%, 100% { 
            transform: scale(1);
            opacity: 0.9;
          }
          50% { 
            transform: scale(1.02);
            opacity: 1;
          }
        }
        
        @keyframes foamPulse {
          0%, 100% { 
            transform: scale(1) translateY(0);
            opacity: 0.7;
          }
          50% { 
            transform: scale(1.05) translateY(-1px);
            opacity: 0.9;
          }
        }
        
        @keyframes bubbleRise {
          0% { 
            transform: translateY(0) scale(0.8);
            opacity: 0;
          }
          30% { 
            opacity: 1;
          }
          70% { 
            opacity: 0.8;
          }
          100% { 
            transform: translateY(-15px) scale(1.2);
            opacity: 0;
          }
        }
        
        /* Pulsing Dots Animation */
        @keyframes dotPulse {
          0%, 80%, 100% {
            opacity: 0.3;
            transform: scale(1);
          }
          40% {
            opacity: 1;
            transform: scale(1.2);
          }
        }
        
        .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background-color: white;
          opacity: 0.3;
          animation: dotPulse 1.5s ease-in-out infinite;
        }
        
        .pulse-dot-1 { animation-delay: 0s; }
        .pulse-dot-2 { animation-delay: 0.2s; }
        .pulse-dot-3 { animation-delay: 0.4s; }
        .pulse-dot-4 { animation-delay: 0.6s; }
        .pulse-dot-5 { animation-delay: 0.8s; }

        @keyframes steamRise {
          0% { 
            opacity: 0;
            transform: translateY(0) scaleY(1);
          }
          20% { 
            opacity: 0.5;
          }
          80% { 
            opacity: 0.3;
          }
          100% { 
            opacity: 0;
            transform: translateY(-10px) scaleY(0.8);
          }
        }
        
        .loading-title {
          font-size: 20px;
          font-weight: 600;
          color: #7FB069;
          margin-bottom: 8px;
          font-family: 'Inter', sans-serif;
        }
        
        .loading-subtitle {
          font-size: 16px;
          color: #64748b;
          margin-bottom: 24px;
          font-family: Georgia, serif;
          font-style: italic;
        }
        
        
        .tags-section {
          margin-top: 20px;
          padding: 20px;
          background: #f8fafc;
          border-radius: 12px;
          border: 1px solid #e2e8f0;
        }
        
        .tags-section-title {
          font-size: 16px;
          font-weight: 600;
          color: #374151;
          margin-bottom: 16px;
          font-family: 'Inter', sans-serif;
        }
        
        .tags-group {
          margin-bottom: 16px;
        }
        
        .tags-group:last-child {
          margin-bottom: 0;
        }
        
        .tags-group-title {
          font-size: 14px;
          font-weight: 500;
          color: #64748b;
          margin-bottom: 8px;
        }
        
        .tags-container {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 12px;
        }
        
        .tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          padding: 4px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: 500;
        }
        
        .auto-tag {
          background: #e0f2fe;
          color: #0369a1;
          border: 1px solid #bae6fd;
        }
        
        .manual-tag {
          background: #7FB069;
          color: white;
          border: 1px solid #5A8449;
        }
        
        .tag-remove {
          background: none;
          border: none;
          color: inherit;
          font-size: 14px;
          font-weight: bold;
          cursor: pointer;
          padding: 0;
          margin-left: 2px;
          opacity: 0.7;
          transition: opacity 0.2s ease;
        }
        
        .tag-remove:hover {
          opacity: 1;
        }
        
        .add-tag-container {
          display: flex;
          gap: 8px;
          align-items: center;
        }
        
        .add-tag-input {
          flex: 1;
          padding: 6px 12px;
          border: 1px solid #d1d5db;
          border-radius: 8px;
          font-size: 14px;
          outline: none;
          transition: border-color 0.2s ease;
        }
        
        .add-tag-input:focus {
          border-color: #7FB069;
          box-shadow: 0 0 0 2px rgba(127, 176, 105, 0.1);
        }
        
        .add-tag-btn {
          padding: 6px 12px;
          background: #7FB069;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        
        .add-tag-btn:hover {
          background: #5A8449;
        }

        /* Mobile responsive styles */
        @media (max-width: 768px) {
          .nova-logo {
            top: 15px;
            left: 15px;
            width: 45px;
            height: 45px;
            border-radius: 14px;
          }
          
          .logo-dots {
            width: 24px;
            height: 24px;
          }
          
          .logo-dot {
            width: 4px;
            height: 4px;
          }
          
          .dream-orb {
            width: 280px;
            height: 280px;
          }
          
          .dream-history {
            margin: 0;
            padding: 5px;
            max-height: calc(100vh - 10px);
            overflow-y: auto;
            top: 5px !important;
            left: 5px !important;
            right: 5px !important;
            bottom: 5px !important;
          }
          
          .dream-history-header {
            padding: 10px;
            position: relative;
          }
          
          .dream-history-header > div:first-child {
            flex-direction: column !important;
            gap: 10px !important;
          }
          
          .dream-history-header h1 {
            font-size: 18px !important;
            margin: 0 !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 200px !important;
          }
          
          .dream-history-header div h1[style*="fontSize"] {
            font-size: 18px !important;
            white-space: nowrap !important;
            overflow: hidden !important;
            text-overflow: ellipsis !important;
            max-width: 200px !important;
          }
          
          .dream-history-header > div:first-child > div:last-child {
            width: 100% !important;
            max-width: none !important;
            flex-direction: column !important;
            gap: 8px !important;
          }

          .search-container {
            width: 100%;
          }

          .search-input {
            width: 100%;
            min-width: unset;
            padding: 6px 10px !important;
            font-size: 13px !important;
            height: 36px !important;
            line-height: 1.2 !important;
          }

          .filter-container {
            width: 100%;
          }

          .filter-select {
            width: 100%;
            padding: 6px 10px !important;
            font-size: 13px !important;
            height: 36px !important;
            line-height: 1.2 !important;
          }

          .dream-history-header > div:first-child > div:last-child > div:last-child {
            width: auto !important;
            align-self: flex-end !important;
            justify-content: flex-end !important;
            padding: 2px !important;
          }

          .dream-history-header > div:first-child > div:last-child > div:last-child button {
            padding: 4px 10px !important;
            font-size: 12px !important;
          }
          
          .dream-grid {
            grid-template-columns: 1fr;
            gap: 12px;
            padding: 0 8px;
          }
          
          .dream-entry {
            max-width: none;
            margin: 0 !important;
          }
          
          .dream-content {
            padding: 16px !important;
          }
          
          .journal-close-btn {
            padding: 8px 20px !important;
            border-radius: 20px !important;
            font-size: 14px !important;
            font-weight: 600 !important;
          }

          .journal-close-btn:hover {
            transform: none !important;
          }
          
          .modal-content {
            margin: 10px;
            max-height: calc(100vh - 40px);
            width: calc(100vw - 20px);
            max-width: calc(100vw - 20px);
          }
          
          .loading-analysis {
            min-width: 90vw !important;
            max-width: 95vw !important;
            padding: 20px !important;
          }
          
          .matcha-brewing {
            min-height: 400px !important;
          }
          
          .matcha-background-container {
            width: 70vw !important;
            max-width: 180px !important;
            aspectRatio: 1197/1669 !important;
            margin: 0 auto !important;
          }
          
          .matcha-bg-image {
            width: 100% !important;
            height: 100% !important;
            aspectRatio: 1197/1669 !important;
          }
        }
      `}</style>

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-2 sm:p-4 lg:p-6" style={{minHeight: '100dvh', paddingTop: 'max(env(safe-area-inset-top), 20px)'}}>
        <svg className="absolute w-0 h-0">
          <filter id="liquid-motion">
            <feTurbulence 
              ref={turbulenceRef}
              type="fractalNoise" 
              baseFrequency="0.012 0.018" 
              numOctaves="3" 
              result="noise" 
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="noise" 
              scale="80" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
            <feGaussianBlur stdDeviation="1" result="blur"/>
          </filter>
          
          <filter id="smoke-distort">
            <feTurbulence 
              type="fractalNoise" 
              baseFrequency="0.02 0.08" 
              numOctaves="4" 
              result="smokeNoise" 
            />
            <feDisplacementMap 
              in="SourceGraphic" 
              in2="smokeNoise" 
              scale="60" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
            <feGaussianBlur stdDeviation="2" result="smokeBlur"/>
            <feComposite in="SourceGraphic" in2="smokeBlur" operator="over"/>
          </filter>
        </svg>

        
        {/* novakitz Logo */}
        <div className="nova-logo" onClick={() => setShowHistory(true)}>
          <div className="logo-dots">
            <div className="logo-dot dot-1"></div>
            <div className="logo-dot dot-2"></div>
            <div className="logo-dot dot-3"></div>
            <div className="logo-dot dot-4"></div>
            <div className="logo-dot dot-5"></div>
            <div className="logo-dot dot-6"></div>
          </div>
        </div>
        
        <main className="w-full max-w-xl mx-auto z-10 flex flex-col items-center text-center">
          {/* Top Right Controls: Premium Badge + Language Selector */}
          <div style={{
            position: 'absolute',
            top: '20px',
            right: '20px',
            display: 'flex',
            gap: '12px',
            zIndex: 1000,
            alignItems: 'center'
          }}>
            {/* Premium Badge */}
            {isPremium && (
              <div style={{
                background: 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)',
                color: '#1f2937',
                padding: '6px 14px',
                borderRadius: '20px',
                fontSize: '0.85rem',
                fontWeight: '600',
                boxShadow: '0 4px 12px rgba(255, 215, 0, 0.3)',
                whiteSpace: 'nowrap'
              }}>
                ✨ Premium
              </div>
            )}
          </div>

          {!showInput && !showResponse && !showHistory && (
            <div
              className="dream-orb flex items-center justify-center fade-in"
              onMouseDown={handleOrbMouseDown}
              onMouseUp={handleOrbMouseUp}
              onMouseLeave={handleOrbMouseLeave}
              onTouchStart={handleOrbMouseDown}
              onTouchEnd={handleOrbMouseUp}
              style={{cursor: 'pointer'}}
            >
              <div className="orb-motion">
                <div className="smoke-base"></div>
                <div className="smoke-layer-1"></div>
                <div className="smoke-layer-2"></div>
                <div className="smoke-layer-3"></div>
              </div>
            </div>
          )}



          {showInput && (
            <div className="modal-overlay" onClick={() => setShowInput(false)}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <div className="flex justify-center">
                    <div className="user-avatar">
                      <div className="loading-dots">
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                        <div className="loading-dot"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="modal-body">
                  {!isRecording && (
                    <input
                      type="text"
                      className="dream-title-input"
                      value={dreamTitle}
                      onChange={(e) => setDreamTitle(e.target.value)}
                      placeholder={t.titlePlaceholder}
                    />
                  )}
                  {isRecording && (
                    <div className="recording-indicator" style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '10px',
                      padding: '10px 0',
                      marginBottom: '10px'
                    }}>
                      <div className="recording-dot" style={{
                        width: '8px',
                        height: '8px',
                        backgroundColor: '#ff4444',
                        borderRadius: '50%',
                        animation: 'pulse 1s infinite'
                      }}></div>
                      <span style={{color: '#7FB069', fontWeight: '500', fontFamily: 'Georgia, "Times New Roman", Times, serif', fontSize: '14px'}}>
                        {t.listeningVoice}
                      </span>
                    </div>
                  )}

                  {!isRecording && (
                    <div style={{display: 'flex', gap: '8px', marginBottom: '12px'}}>
                      <input
                        type="date"
                        value={dreamDate.toISOString().split('T')[0]}
                        onChange={(e) => {
                          const newDate = new Date(e.target.value + 'T00:00:00');
                          setDreamDate(newDate);
                        }}
                        style={{
                          flex: 1,
                          padding: '8px',
                          borderRadius: '8px',
                          border: '1px solid rgba(127, 176, 105, 0.3)',
                          backgroundColor: 'rgba(255, 255, 255, 0.05)',
                          color: '#7FB069',
                          fontFamily: 'Georgia, serif',
                          fontSize: '14px',
                          cursor: 'pointer'
                        }}
                      />
                    </div>
                  )}

                  <textarea
                    className="dream-input"
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    placeholder={isRecording ? t.voiceInProgress : t.dreamPlaceholder}
                    rows={4}
                    autoFocus={!isRecording}
                    disabled={isRecording}
                  />
                  <div className={`char-counter ${dreamText.trim().length >= 10 ? 'sufficient' : ''}`}>
                    {dreamText.trim().length}/10 characters {dreamText.trim().length >= 10 ? t.charactersReady : ''}
                  </div>
                </div>
                <div className="modal-actions" style={{display: 'flex', gap: '12px'}}>
                  <button
                    onClick={async () => {
                      const noDreamMessage = language === 'ko'
                        ? '오늘은 꿈을 기억하지 못했네요. 괜찮습니다. 내일의 꿈을 기대해봅시다! 🌙'
                        : 'You didn\'t remember a dream today. That\'s okay! Let\'s look forward to tomorrow\'s dreams! 🌙';

                      setIsLoading(true);
                      setShowInput(false);
                      setShowResponse(true);
                      setDreamResponse(noDreamMessage);

                      // Save "no dream" marker to Supabase for calendar display
                      if (user) {
                        try {
                          const today = new Date().toISOString().split('T')[0];
                          await supabase
                            .from('dreams')
                            .insert([{
                              user_id: user.id,
                              title: language === 'ko' ? '꿈 안 꿈' : 'No Dream',
                              content: language === 'ko' ? '오늘은 꿈을 꾸지 않았습니다.' : 'I did not have any dream today.',
                              mood: 'peaceful',
                              tags: [language === 'ko' ? '꿈안꿈' : 'no-dream'],
                              date: new Date().toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              }),
                              time: new Date().toLocaleTimeString('en-US', {
                                hour: '2-digit',
                                minute: '2-digit'
                              }),
                              created_at: new Date().toISOString()
                            }]);
                          console.log('No dream marker saved to calendar');
                        } catch (error) {
                          console.error('Error saving no dream marker:', error);
                        }
                      }

                      // Reset form
                      setDreamText('');
                      setDreamTitle('');
                      setDreamDate(new Date()); // Reset dream date to today
                      setDreamImage('');

                      setTimeout(() => {
                        setShowResponse(false);
                        setIsLoading(false);
                      }, 2000);
                    }}
                    style={{
                      flex: 1,
                      padding: '12px',
                      background: 'rgba(127, 176, 105, 0.08)',
                      color: '#7FB069',
                      border: '1px solid rgba(127, 176, 105, 0.2)',
                      borderRadius: '8px',
                      fontSize: '0.9rem',
                      fontWeight: '500',
                      cursor: 'pointer',
                      transition: 'all 0.2s'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
                    }}
                  >
                    {language === 'ko' ? '꿈 안 꿈 💤' : 'No dream 💤'}
                  </button>
                  <button
                    onClick={handleSubmitDream}
                    disabled={!dreamText.trim() || dreamText.trim().length < 10 || isLoading}
                    className="btn-primary"
                    style={{flex: 1}}
                  >
                    {isLoading ? t.brewing : t.brew}
                  </button>
                </div>
              </div>
            </div>
          )}


          {showHistory && (
            <div className="dream-history fade-in" style={{
              display: 'flex',
              flexDirection: 'column',
              height: '90vh',
              maxHeight: '90vh',
              overflowY: 'auto'
            }}>
              <div className="dream-history-header" style={{
                position: 'sticky',
                top: 0,
                background: 'white',
                zIndex: 10,
                paddingBottom: '16px',
                borderBottom: '1px solid #e5e7eb'
              }}>
                <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '16px', width: '100%'}}>
                  <div style={{flex: '1'}}>
                    <h1 style={{fontSize: '30px', fontWeight: 'bold', color: '#1f2937', margin: '0'}}>
                      {t.dreamJournal}
                    </h1>
                    {searchTerm || selectedTag ? (
                      <div style={{marginTop: '8px', fontSize: '14px', color: '#6b7280'}}>
                        {t.showing} {filteredDreams.length} {t.of} {savedDreams.length} {t.dreams}
                        {searchTerm && ` ${t.matching} "${searchTerm}"`}
                        {selectedTag && ` ${t.taggedWith} "#${selectedTag}"`}
                      </div>
                    ) : null}
                  </div>

                  {/* Close Button at Far Right */}
                  <button
                    onClick={() => {
                      setShowHistory(false);
                      onHistoryClose?.();
                    }}
                    className="journal-close-btn"
                    style={{
                      padding: '6px 12px',
                      fontSize: '14px',
                      fontWeight: '500',
                      color: '#6b7280',
                      background: '#f3f4f6',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                      flexShrink: 0,
                      marginLeft: '12px'
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = '#e5e7eb';
                      e.currentTarget.style.color = '#1f2937';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = '#f3f4f6';
                      e.currentTarget.style.color = '#6b7280';
                    }}
                  >
                    Close
                  </button>

                  {/* Search and Filter Controls - FORCED RIGHT SIDE */}
                  <div style={{display: 'flex', gap: '12px', alignItems: 'center', flexShrink: 0}}>
                    <div className="search-container">
                      <input
                        type="text"
                        placeholder={t.searchPlaceholder}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                      />
                    </div>
                    <div className="filter-container">
                      <select
                        value={selectedTag}
                        onChange={(e) => setSelectedTag(e.target.value)}
                        className="filter-select"
                      >
                        <option value="">All Tags</option>
                        {allTags.map(tag => (
                          <option key={tag} value={tag}>#{tag}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{display: 'flex', gap: '4px', background: '#f1f5f9', borderRadius: '8px', padding: '4px'}}>
                      <button onClick={() => {setViewMode('card'); setShowHistory(true);}} style={{padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'card' ? '#ffffff' : 'transparent', color: viewMode === 'card' ? '#1f2937' : '#64748b', fontWeight: viewMode === 'card' ? '600' : '400', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'}}>{t.card}</button>
                      <button onClick={() => {setViewMode('calendar'); setShowHistory(true);}} style={{padding: '6px 12px', borderRadius: '6px', border: 'none', background: viewMode === 'calendar' ? '#ffffff' : 'transparent', color: viewMode === 'calendar' ? '#1f2937' : '#64748b', fontWeight: viewMode === 'calendar' ? '600' : '400', fontSize: '14px', cursor: 'pointer', transition: 'all 0.2s'}}>Calendar</button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Daily Rituals Section */}
              <div style={{
                padding: '20px 24px',
                borderTop: '1px solid #e5e7eb',
                borderBottom: '1px solid #e5e7eb',
                background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.5) 0%, rgba(255, 250, 245, 0.3) 100%)'
              }}>
                <h3 style={{
                  fontSize: '1.1rem',
                  fontWeight: 600,
                  color: '#1f2937',
                  margin: '0 0 20px 0'
                }}>
                  {language === 'ko' ? '오늘의 확언과 성찰' : 'Daily Affirmations & Reflection'}
                </h3>

                {user && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {/* Morning Ritual */}
                    <div>
                      <MorningRitual userId={user.id} language={language || 'en'} />
                    </div>

                    {/* Check-in Options */}
                    <div style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                      gap: '12px'
                    }}>
                      <DailyCheckin
                        userId={user.id}
                        language={language || 'en'}
                        timeOfDay="morning"
                        dreamText={dreamText}
                        dreamId={lastSavedDreamId}
                        isPremium={isPremium}
                      />
                      <DailyCheckin
                        userId={user.id}
                        language={language || 'en'}
                        timeOfDay="evening"
                        dreamText={dreamText}
                        dreamId={lastSavedDreamId}
                        isPremium={isPremium}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div className="dream-history-container" style={{paddingTop: '20px', position: 'relative'}}>
              {viewMode === 'calendar' ? (
                <div style={{
                  display: 'flex',
                  flexDirection: 'column'
                }}>
                  <DreamCalendar
                    dreams={filteredDreams as any}
                    onDateSelect={(date) => {
                      // Find all dreams for the selected date (date is in toDateString() format: "Wed Nov 29 2024")
                      const dreamsForDate = filteredDreams.filter(d => {
                        // Check both date field (from SimpleDreamInterface) and created_at field (from Supabase)
                        if ('date' in d && typeof (d as any).date === 'string') {
                          // SimpleDreamInterface DreamEntry with formatted date
                          const formattedDate = new Date(date).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric'
                          });
                          return (d as any).date === formattedDate;
                        }
                        if ('created_at' in d && typeof (d as any).created_at === 'string') {
                          // Supabase Dream with ISO created_at
                          return new Date((d as any).created_at).toDateString() === date;
                        }
                        return false;
                      });

                      // Select the first dream and show all dreams from that date
                      if (dreamsForDate.length > 0) {
                        setSelectedDream(dreamsForDate[0] as DreamEntry);
                      }
                    }}
                    selectedDate={null}
                  />
                </div>
              ) : (
              <div className="dream-grid" style={{
                paddingBottom: '20px'
              }}>
                {filteredDreams.slice(0, 9).map((dream, index) => {
                  const gradients = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #a8edea 0%, #fed6e3 100%)',
                    'linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)',
                    'linear-gradient(135deg, #ff8a80 0%, #ea4c46 100%)',
                    'linear-gradient(135deg, #8fd3f4 0%, #84fab0 100%)'
                  ];
                  return (
                    <div key={dream.id} className="dream-entry" onClick={() => setSelectedDream(dream)}>
                      <div className="dream-image" style={{
                        background: dream.image ? 'none' : gradients[index % gradients.length],
                        backgroundImage: dream.image ? `url(${dream.image})` : 'none',
                        backgroundSize: 'cover',
                        backgroundPosition: 'center'
                      }}>
                        {/* Camera overlay for adding photos */}
                        <div 
                          className="camera-overlay"
                          onClick={(e) => {
                            e.stopPropagation();
                            // Create hidden file input for this specific dream
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = (event) => {
                              const file = (event.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const reader = new FileReader();
                                reader.onload = (e) => {
                                  const imageUrl = e.target?.result as string;
                                  // Update the dream with new image
                                  const updatedDreams = savedDreams.map(d => 
                                    d.id === dream.id ? { ...d, image: imageUrl } : d
                                  );
                                  setSavedDreams(updatedDreams);
                                  localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
                                };
                                reader.readAsDataURL(file);
                              }
                            };
                            input.click();
                          }}
                        >
                          <div className="camera-icon">+</div>
                        </div>
                      </div>

                      <div className="dream-actions">
                        <button
                          className="dots-menu-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            setActiveMenu(activeMenu === dream.id ? null : dream.id);
                          }}
                        >
                          ⋮
                          {activeMenu === dream.id && (
                            <div className="dots-menu">
                              <button
                                className="menu-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  shareDream(dream);
                                }}
                              >
                                <span className="menu-icon">
                                  <svg viewBox="0 0 24 24">
                                    <path d="M18 8.5c0-.8.7-1.5 1.5-1.5S21 7.7 21 8.5 20.3 10 19.5 10 18 9.3 18 8.5zM4.5 12c-.8 0-1.5.7-1.5 1.5S3.7 15 4.5 15 6 14.3 6 13.5 5.3 12 4.5 12zM18 16.5c0-.8.7-1.5 1.5-1.5s1.5.7 1.5 1.5-.7 1.5-1.5 1.5-1.5-.7-1.5-1.5z"/>
                                    <line x1="6" y1="13.5" x2="18" y2="8.5"/>
                                    <line x1="6" y1="13.5" x2="18" y2="16.5"/>
                                  </svg>
                                </span>
                                Share
                              </button>
                              <button
                                className="menu-item"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditDream(dream);
                                }}
                              >
                                <span className="menu-icon">
                                  <svg viewBox="0 0 24 24">
                                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                                  </svg>
                                </span>
                                Edit
                              </button>
                              <button
                                className="menu-item danger"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteDream(dream.id);
                                }}
                              >
                                <span className="menu-icon">
                                  <svg viewBox="0 0 24 24">
                                    <polyline points="3,6 5,6 21,6"/>
                                    <path d="M19,6v14a2,2,0,0,1-2,2H7a2,2,0,0,1-2-2V6m3,0V4a2,2,0,0,1,2-2h4a2,2,0,0,1,2,2V6"/>
                                    <line x1="10" y1="11" x2="10" y2="17"/>
                                    <line x1="14" y1="11" x2="14" y2="17"/>
                                  </svg>
                                </span>
                                Delete
                              </button>
                            </div>
                          )}
                        </button>
                      </div>

                      <div className="dream-content">
                        <div className="dream-title">
                          <span className="dream-icon"></span>
                          <span className="dream-title-text">{dream.title || t.dreamEntry}</span>
                        </div>
                        <div className="dream-date">
                          {dream.userName && dream.userName !== 'Anonymous' && <span style={{color: '#7FB069', fontWeight: '500', marginRight: '8px'}}>by {dream.userName}</span>}
                          {dream.date} {dream.time && `at ${dream.time}`}
                        </div>
                        <div className="dream-meta">
                          {dream.userName && dream.userName !== 'Anonymous' && <span style={{color: '#7FB069', fontWeight: '500', marginRight: '8px'}}>by {dream.userName}</span>}
                          {dream.date} {dream.time && `at ${dream.time}`}
                        </div>

                        {/* Tags Display */}
                        {(dream.autoTags && dream.autoTags.length > 0) && (
                          <div className="dream-tags" style={{marginTop: '12px'}}>
                            {dream.autoTags.map(tag => (
                              <span 
                                key={tag}
                                className="tag"
                                style={{
                                  display: 'inline-block',
                                  background: '#7FB069',
                                  color: 'white',
                                  fontSize: '12px',
                                  padding: '4px 8px',
                                  borderRadius: '12px',
                                  marginRight: '6px',
                                  marginBottom: '4px'
                                }}
                                title=""
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {savedDreams.length === 0 && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                    color: '#64748b',
                    fontSize: '18px',
                    fontFamily: 'Georgia, "Times New Roman", Times, serif'
                  }}>
                    <div style={{fontWeight: '500', marginBottom: '8px', fontSize: '20px', lineHeight: '1.3', whiteSpace: 'nowrap'}}>Welcome to your Dream Journal</div>
                    <div style={{fontSize: '16px', opacity: '0.8'}}>Record your first dream to begin your journey</div>
                  </div>
                )}
              </div>
              )}
              </div>
            </div>
          )}

          {editingDream && (
            <div className="edit-modal-overlay" onClick={cancelEditDream}>
              <div className="edit-modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="edit-modal-header">
                  <div className="edit-modal-title">Edit Dream</div>
                </div>
                <div className="edit-modal-body">
                  <input
                    type="text"
                    className="edit-input"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    placeholder={t.dreamTitle}
                  />
                  <textarea
                    className="edit-input edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder={t.describeDream}
                  />
                  
                  {/* Simplified Tags Section */}
                  <div className="tags-section">
                    {/* All Tags Display */}
                    <div className="tags-container" style={{marginBottom: '16px'}}>
                      {[...editAutoTags, ...editTags].map((tag, index) => (
                        <button 
                          key={`${tag}-${index}`} 
                          className="btn-secondary"
                          style={{
                            marginRight: '8px',
                            marginBottom: '8px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}
                          title=""
                          onClick={() => {
                            if (editAutoTags.includes(tag)) {
                              removeTag(tag, true);
                            } else {
                              removeTag(tag, false);
                            }
                          }}
                        >
                          #{tag}
                          <span style={{marginLeft: '4px', opacity: '0.7'}}>×</span>
                        </button>
                      ))}
                    </div>
                    
                    {/* Tag Input */}
                    <input
                      type="text"
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                      placeholder={t.typeToAddTags}
                      className="edit-input"
                      style={{marginBottom: '0'}}
                    />
                  </div>
                </div>
                <div className="edit-actions">
                  <button onClick={cancelEditDream} className="btn-cancel">
                    {t.cancel}
                  </button>
                  <button onClick={saveEditDream} className="btn-save">
                    {t.save}
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedDream && (
            <div className="dream-detail-overlay" onClick={() => setSelectedDream(null)}>
              <div className="dream-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dream-detail-header" style={{background: 'linear-gradient(135deg, #7fb069 0%, #a8d5a8 50%, #c3e6cb 100%)', position: 'relative'}}>
                  {/* Button container for top-right alignment */}
                  <div style={{
                    position: 'absolute',
                    top: '12px',
                    right: '12px',
                    display: 'flex',
                    gap: '8px',
                    alignItems: 'center',
                    zIndex: 15
                  }}>
                    {/* Share button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        shareDream(selectedDream, e);
                      }}
                      className="dream-detail-share-btn"
                      style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: window.innerWidth < 480 ? '6px 10px' : '8px 12px',
                        fontSize: window.innerWidth < 480 ? '12px' : '14px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"></path>
                        <polyline points="16 6 12 2 8 6"></polyline>
                        <line x1="12" y1="2" x2="12" y2="15"></line>
                      </svg>
                      {language === 'ko' ? '공유' : 'Share'}
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDream(null);
                        startEditDream(selectedDream);
                      }}
                      className="dream-detail-edit-btn"
                      style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: window.innerWidth < 480 ? '6px 12px' : '8px 16px',
                        fontSize: window.innerWidth < 480 ? '12px' : '14px',
                        fontWeight: '600',
                        color: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        fontFamily: 'Georgia, serif',
                        whiteSpace: 'nowrap'
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    >
                      {language === 'ko' ? '수정' : 'Edit'}
                    </button>

                    {/* Close button (X) */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedDream(null);
                      }}
                      className="dream-detail-close"
                      style={{
                        background: 'rgba(255, 255, 255, 0.3)',
                        border: 'none',
                        borderRadius: '50%',
                        width: '32px',
                        height: '32px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        fontSize: '24px',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        flexShrink: 0
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.4)'}
                      onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255, 255, 255, 0.3)'}
                    >
                      ×
                    </button>
                  </div>
                  <div className="dream-detail-title">{selectedDream.title || t.dreamEntry}</div>
                  <div className="dream-detail-date">{selectedDream.date} {selectedDream.time && `at ${selectedDream.time}`}</div>
                </div>
                <div className="dream-detail-body">
                  {selectedDream.image && (
                    <div className="dream-detail-image-container" style={{marginBottom: '20px'}}>
                      <img
                        src={selectedDream.image}
                        alt="Dream visual"
                        style={{
                          width: '100%',
                          maxHeight: '200px',
                          objectFit: 'cover',
                          borderRadius: '8px',
                          cursor: 'default'
                        }}
                      />
                    </div>
                  )}
                  <div className="dream-detail-content">
                    {selectedDream.text}
                  </div>
                  <div className="dream-detail-response">
                    <div className="dream-detail-response-title">Dream Analysis</div>
                    <div className="analysis-content">
                      {selectedDream.response.split('\n\n').map((section, index) => {
                        const trimmedSection = section.trim();
                        if (!trimmedSection) return null; // Skip empty sections
                        
                        if (trimmedSection.startsWith('DREAM SYMBOLS:')) {
                          const content = trimmedSection.replace('DREAM SYMBOLS:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">Dream Symbols</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('INNER MESSAGE:')) {
                          const content = trimmedSection.replace('INNER MESSAGE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">Inner Message</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('TODAY\'S PRACTICE:')) {
                          const content = trimmedSection.replace('TODAY\'S PRACTICE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">{t.todaysPractice}</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('SOMETHING TO REFLECT ON:')) {
                          const content = trimmedSection.replace('SOMETHING TO REFLECT ON:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">Something to Reflect On</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.length > 5) { // Only show if meaningful content
                          return (
                            <div key={index} className="analysis-section">
                              <p className="section-text">{trimmedSection}</p>
                            </div>
                          );
                        }
                        return null;
                      }).filter(Boolean)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResponse && (
            <div className="modal-overlay" onClick={() => {setShowResponse(false); setIsLoading(false);}}>
              {isLoading ? (
                <div className="loading-container-transparent" onClick={(e) => e.stopPropagation()}>
                  <div className="loading-analysis">
                    <div style={{
                      display: 'flex', 
                      flexDirection: 'column',
                      justifyContent: 'center', 
                      alignItems: 'center', 
                      width: '100%',
                      minHeight: '400px',
                      textAlign: 'center'
                    }}>
                      {/* Simple Matcha Image */}
                      <div style={{
                        width: '100%',
                        maxWidth: '200px',
                        aspectRatio: '1197/1669',
                        margin: '0 auto'
                      }}>
                        <div 
                          style={{
                            backgroundImage: 'url(/matcha-frame1.png?v=8)',
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                            width: '100%',
                            height: '100%',
                            aspectRatio: '1197/1669'
                          }}
                        />
                      </div>
                      
                      {/* Pulsing Dots Loading Bar */}
                      <PulseDots />
                      
                      {/* Simple Text */}
                      <p style={{
                        fontFamily: 'Georgia, "Times New Roman", Times, serif',
                        color: 'white',
                        textAlign: 'center',
                        margin: '0',
                        fontSize: '18px',
                        fontWeight: '500',
                        textShadow: '0 2px 4px rgba(0,0,0,0.3)'
                      }}>
                        Whisking up wisdom from your dream...
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="modal-content" style={{maxWidth: '600px'}} onClick={(e) => e.stopPropagation()}>
                  <div className="modal-header">
                    <div className="flex justify-center">
                      <h2 style={{color: '#7FB069', fontSize: '24px', fontWeight: '600', textAlign: 'center'}}>
                        Dream Analysis
                      </h2>
                    </div>
                  </div>
                  <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto', padding: '24px'}}>
                    <div className="analysis-content">
                      {dreamResponse.split('\n\n').map((section, index) => {
                        const trimmedSection = section.trim();
                        if (!trimmedSection) return null; // Skip empty sections
                        
                        if (trimmedSection.startsWith('DREAM SYMBOLS:')) {
                          const content = trimmedSection.replace('DREAM SYMBOLS:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">Dream Symbols</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('INNER MESSAGE:')) {
                          const content = trimmedSection.replace('INNER MESSAGE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">Inner Message</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('TODAY\'S PRACTICE:')) {
                          const content = trimmedSection.replace('TODAY\'S PRACTICE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">{t.todaysPractice}</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('SOMETHING TO REFLECT ON:')) {
                          const content = trimmedSection.replace('SOMETHING TO REFLECT ON:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">Something to Reflect On</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.length > 5) { // Only show if meaningful content
                          return (
                            <div key={index} className="analysis-section">
                              <p className="section-text">{trimmedSection}</p>
                            </div>
                          );
                        }
                        return null;
                      }).filter(Boolean)}
                    </div>
                  </div>
                  <div className="modal-actions">
                    <button
                      onClick={() => {
                        setShowResponse(false);
                        setShowHistory(true);
                      }}
                      className="btn-primary"
                    >
                      Save to Journal
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}


        </main>

        {/* Voice Guide Popup */}
        {showVoiceGuide && (
          <div className="modal-overlay" onClick={() => setShowVoiceGuide(false)}>
            <div className="modal-content voice-guide-modal" onClick={(e) => e.stopPropagation()}>
              <div className="modal-header">
                <h2 style={{color: '#7FB069', fontSize: '24px', fontWeight: '600', textAlign: 'center', fontFamily: 'Georgia, "Times New Roman", Times, serif'}}>
                  {language === 'ko' ? '음성 입력 가이드' : 'Voice Input Guide'}
                </h2>
              </div>
              <div className="modal-body" style={{padding: '20px', textAlign: 'center', fontFamily: 'Georgia, "Times New Roman", Times, serif'}}>
                <div style={{marginBottom: '20px', fontSize: '16px', lineHeight: '1.6'}}>
                  <div style={{marginBottom: '15px', padding: '12px', background: '#f0f9f0', borderRadius: '8px', fontSize: '14px', color: '#5a8449'}}>
                    💡 <strong>{language === 'ko' ? '처음 사용하시나요?' : 'First time?'}</strong> {language === 'ko' ? '브라우저가 마이크 권한을 요청할 거예요. "허용"을 선택하면 음성 입력을 사용할 수 있어요.' : 'Your browser will ask for microphone permission once. Choose "Allow" to enable voice input.'}
                  </div>
                  <div style={{marginBottom: '15px'}}>
                    <strong>{language === 'ko' ? '짧게 클릭:' : 'Short click:'}</strong> {language === 'ko' ? '텍스트로 입력하기' : 'Type your dream'}
                  </div>
                  <div style={{marginBottom: '15px'}}>
                    <strong>{language === 'ko' ? '길게 누르기:' : 'Long press:'}</strong> {language === 'ko' ? '음성으로 말하기' : 'Speak your dream'}
                  </div>
                  <div style={{fontSize: '14px', color: '#666', marginTop: '15px'}}>
                    {language === 'ko' ? '음성 인식은 Chrome, Safari 등 최신 브라우저에서 지원돼요' : 'Voice recognition is supported in Chrome, Safari and other modern browsers'}
                  </div>
                </div>
                <div style={{display: 'flex', gap: '10px', justifyContent: 'center'}}>
                  <button
                    onClick={() => {
                      setShowVoiceGuide(false);
                      localStorage.setItem('hasSeenVoiceGuide', 'true');
                      setHasSeenVoiceGuide(true);
                      handleAnalyze();
                    }}
                    className="btn-secondary"
                    style={{padding: '10px 20px', fontFamily: 'Georgia, "Times New Roman", Times, serif'}}
                  >
                    {language === 'ko' ? '텍스트 입력' : 'Text Input'}
                  </button>
                  <button
                    onClick={() => {
                      setShowVoiceGuide(false);
                      localStorage.setItem('hasSeenVoiceGuide', 'true');
                      setHasSeenVoiceGuide(true);
                      startVoiceRecording();
                    }}
                    className="btn-primary"
                    style={{padding: '10px 20px', fontFamily: 'Georgia, "Times New Roman", Times, serif'}}
                  >
                    {language === 'ko' ? '음성 입력' : 'Voice Input'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </div>
      </div>

      {/* Badge Notification */}
      {newBadge && (
        <BadgeNotification
          badgeType={newBadge}
          onClose={() => setNewBadge(null)}
          language={language}
        />
      )}

      {/* Streak Popup */}
      {showStreakPopup && user && (
        <StreakPopup
          user={user}
          language={language}
          onClose={() => setShowStreakPopup(false)}
        />
      )}

      {/* Share Modal with Glassmorphism */}
      {showShareModal && shareModalDream && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 10001
        }} onClick={() => setShowShareModal(false)}>
          <div style={{
            background: 'rgba(255, 255, 255, 0.95)',
            backdropFilter: 'blur(10px)',
            borderRadius: '20px',
            padding: '28px',
            width: '90%',
            maxWidth: '420px',
            boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            border: '1px solid rgba(255, 255, 255, 0.3)',
            animation: 'slideUp 0.3s ease'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{
              fontSize: '20px',
              fontWeight: '700',
              color: '#1a1a1a',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              {language === 'ko' ? '꿈을 공유하세요' : 'Share Your Dream'}
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {/* Copy Link Button */}
              <button
                onClick={() => handleShareOption('link')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #7FB069 0%, #a8d5a8 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(127, 176, 105, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(127, 176, 105, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(127, 176, 105, 0.2)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M8 17v-3m0 0v-6m0 6l-6-6m6 6l6-6" />
                  <path d="M16 7h-4v6h4V7z" />
                </svg>
                {language === 'ko' ? '링크 복사' : 'Copy Link'}
              </button>

              {/* Instagram Button */}
              <button
                onClick={() => handleShareOption('instagram')}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '14px 16px',
                  background: 'linear-gradient(135deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)',
                  border: 'none',
                  borderRadius: '14px',
                  color: 'white',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(220, 39, 67, 0.2)'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(220, 39, 67, 0.3)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(220, 39, 67, 0.2)';
                }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.204-.012 3.584-.07 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zM5.838 12a6.162 6.162 0 1 1 12.324 0 6.162 6.162 0 0 1-12.324 0zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm4.965-10.322a1.44 1.44 0 1 1 2.881.001 1.44 1.44 0 0 1-2.881-.001z"/>
                </svg>
                {language === 'ko' ? 'Instagram' : 'Instagram'}
              </button>

              {/* Native Share Button */}
              {typeof navigator !== 'undefined' && 'share' in navigator && (
                <button
                  onClick={() => handleShareOption('native')}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '14px 16px',
                    background: 'rgba(127, 176, 105, 0.1)',
                    border: '2px solid #7FB069',
                    borderRadius: '14px',
                    color: '#7FB069',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(127, 176, 105, 0.1)';
                  }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="18" cy="5" r="3"></circle>
                    <circle cx="6" cy="12" r="3"></circle>
                    <circle cx="18" cy="19" r="3"></circle>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
                  </svg>
                  {language === 'ko' ? '더 많이 공유' : 'More Options'}
                </button>
              )}

              {/* Cancel Button */}
              <button
                onClick={() => setShowShareModal(false)}
                style={{
                  padding: '12px 16px',
                  background: 'rgba(127, 176, 105, 0.08)',
                  border: '1px solid rgba(127, 176, 105, 0.2)',
                  borderRadius: '14px',
                  color: '#7FB069',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(127, 176, 105, 0.08)';
                }}
              >
                {language === 'ko' ? '닫기' : 'Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast */}
      {showShareToast && (
        <div style={{
          position: 'fixed',
          bottom: '30px',
          left: '50%',
          transform: 'translateX(-50%)',
          background: '#7FB069',
          color: 'white',
          padding: '12px 24px',
          borderRadius: '12px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.2)',
          zIndex: 10000,
          fontWeight: '500',
          opacity: 1,
          transition: 'opacity 0.3s ease'
        }}>
          {language === 'ko' ? '링크가 복사되었어요! 📋' : 'Link copied! 📋'}
        </div>
      )}

      {/* API Monitoring Dashboard - 개발 환경에서만 표시 */}
      {process.env.NODE_ENV === 'development' && <APIMonitoringDashboard />}
    </div>
  );
}/* Force rebuild Tue Sep 16 01:17:14 KST 2025 */
/* Force rebuild 1757991063 */
