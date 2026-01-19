'use client';

import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, Dream } from '../lib/supabase';
import DreamCalendar from './DreamCalendar';
import SubscriptionManager from './SubscriptionManager';
import { filterDreamsByHistoryLimit, getUserPlanInfo } from '../lib/subscription';

interface DreamJournalProps {
  user: User | null;
  onSignOut: () => void;
  showGuestMode?: boolean;
  onShowAuth: () => void;
  language?: 'en' | 'ko';
}

interface DreamPattern {
  keyword: string;
  count: number;
  entries: string[];
}

const moodEmojis = {
  peaceful: '',
  excited: '😃',
  confused: '😵',
  scared: '',
  happy: '',
  sad: '',
  mysterious: '🤔',
  surreal: ''
};

export default function DreamJournal({ user, onSignOut, showGuestMode = false, onShowAuth, language = 'en' }: DreamJournalProps) {
  const [currentView, setCurrentView] = useState<'new' | 'history' | 'patterns' | 'calendar'>('new');
  const [dreams, setDreams] = useState<Dream[]>([]);
  const [newDream, setNewDream] = useState({
    title: '',
    content: '',
    mood: 'peaceful',
    tags: ''
  });
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [userPlanInfo, setUserPlanInfo] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const DREAMS_PER_PAGE = 9;

  // Load dreams from Supabase
  useEffect(() => {
    loadDreams();
  }, [user]);

  const loadDreams = async () => {
    if (!user) {
      setDreams([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);

      // Load from Supabase using RPC function (secure with RLS)
      const { data, error } = await supabase
        .rpc('get_dreams_with_user')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Apply history limit filtering based on subscription tier
      const filteredDreams = await filterDreamsByHistoryLimit(user.id, (data as Dream[]) || []);
      setDreams(filteredDreams as Dream[]);

      // Load user's plan info
      const planInfo = await getUserPlanInfo(user.id);
      setUserPlanInfo(planInfo);
    } catch (error: any) {
      setError(error.message);
      console.error('Error loading dreams:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveDream = async () => {
    if (!newDream.title.trim() || !newDream.content.trim()) return;

    // If user is not logged in, show auth modal instead of saving
    if (!user) {
      onShowAuth();
      return;
    }

    setIsRecording(true);
    setError('');

    try {
      const now = new Date();
      const dreamData = {
        ...(user && { user_id: user.id }),
        title: newDream.title,
        content: newDream.content,
        date: now.toLocaleDateString('en-US', { 
          year: 'numeric', 
          month: 'long', 
          day: 'numeric' 
        }),
        time: now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        mood: newDream.mood,
        tags: newDream.tags ? newDream.tags.split(',').map(tag => tag.trim().toLowerCase()) : []
      };

      // Save to Supabase (user is guaranteed to exist at this point)
      const { data, error } = await supabase
        .from('dreams')
        .insert([dreamData])
        .select()
        .single();

      if (error) throw error;

      // Add new dream to local state - using functional setState
      setDreams(prev => [data, ...prev]);

      // Reset form
      setNewDream({
        title: '',
        content: '',
        mood: 'peaceful',
        tags: ''
      });
      
      setCurrentView('history');
    } catch (error: any) {
      setError(error.message);
      console.error('Error saving dream:', error);
    } finally {
      setIsRecording(false);
    }
  };

  const deleteDream = async (id: string) => {
    if (!user) return;

    try {
      // Delete from Supabase
      const { error } = await supabase
        .from('dreams')
        .delete()
        .eq('id', id)
        .eq('user_id', user.id);

      if (error) throw error;

      // Remove dream from local state
      setDreams(dreams.filter(dream => dream.id !== id));
    } catch (error: any) {
      setError(error.message);
      console.error('Error deleting dream:', error);
    }
  };

  const findPatterns = (): DreamPattern[] => {
    const wordCount: { [key: string]: { count: number; entries: string[] } } = {};
    
    dreams.forEach(dream => {
      const text = `${dream.title} ${dream.content}`.toLowerCase();
      const words = text.match(/\b\w+\b/g) || [];
      
      // Filter meaningful words (exclude common words)
      const meaningfulWords = words.filter(word => 
        word.length > 3 && 
        !['this', 'that', 'with', 'have', 'been', 'were', 'they', 'there', 'their', 'said', 'what', 'when', 'where', 'would', 'could', 'should'].includes(word)
      );

      meaningfulWords.forEach(word => {
        if (!wordCount[word]) {
          wordCount[word] = { count: 0, entries: [] };
        }
        wordCount[word].count++;
        if (dream.id && !wordCount[word].entries.includes(dream.id)) {
          wordCount[word].entries.push(dream.id);
        }
      });
    });

    return Object.entries(wordCount)
      .filter(([_, data]) => data.count >= 2) // Show words that appear in 2+ dreams
      .map(([keyword, data]) => ({
        keyword,
        count: data.count,
        entries: data.entries
      }))
      .toSorted((a, b) => b.count - a.count)
      .slice(0, 10); // Top 10 patterns
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const handleDateSelect = (dateString: string) => {
    setSelectedDate(dateString);
    setCurrentView('history'); // Switch to history view to show dreams for selected date
  };

  const getFilteredDreams = () => {
    let filtered = dreams;

    if (selectedDate && currentView === 'history') {
      filtered = dreams.filter(dream => {
        const dreamDate = dream.created_at
          ? new Date(dream.created_at).toDateString()
          : new Date().toDateString();
        return dreamDate === selectedDate;
      });
    }

    return filtered;
  };

  const getPaginatedDreams = () => {
    const filtered = getFilteredDreams();
    const start = currentPage * DREAMS_PER_PAGE;
    const end = start + DREAMS_PER_PAGE;
    return filtered.slice(start, end);
  };

  const getTotalPages = () => {
    const filtered = getFilteredDreams();
    return Math.ceil(filtered.length / DREAMS_PER_PAGE);
  };

  const goToNextPage = () => {
    if (currentPage < getTotalPages() - 1) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 0) {
      setCurrentPage(currentPage - 1);
    }
  };

  const goToPage = (pageIndex: number) => {
    setCurrentPage(pageIndex);
  };

  // Reset to page 0 when view changes or filter changes
  useEffect(() => {
    setCurrentPage(0);
  }, [currentView, selectedDate]);

  const clearDateFilter = () => {
    setSelectedDate(null);
  };

  if (loading && dreams.length === 0) {
    return (
      <section className="dream-journal">
        <div className="container">
          <div className="loading-container">
            <div className="loading-spinner">
              <div className="hero-teacup">🍵</div>
              <p>Loading your dreams...</p>
            </div>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="dream-journal">
      <div className="container">
        {/* User Header - Only show when logged in */}

        {/* Error Message */}
        {error && (
          <div className="error-message">
            <span>⚠️</span>
            {error}
            <button onClick={() => setError('')} className="error-close">✕</button>
          </div>
        )}

        {/* Subscription Manager - Show to authenticated users */}
        {user && <SubscriptionManager user={user} language={language} />}

        {/* Header */}
        <div className="hero-section">
          <div className="hero-teacup">🍵</div>
          <h1 className="hero-main-title">Welcome to your Dream Journal</h1>
          <p className="hero-subtitle">Record your first dream to begin your journey</p>
        </div>

        {/* Simple Dream Input */}
        {currentView === 'new' && (
          <div className="simple-dream-section">
            <h2 className="dream-prompt">Tell me about your dream:</h2>
            
            <div className="simple-dream-form">
              <div className="title-input-group">
                <input
                  type="text"
                  value={newDream.title}
                  onChange={(e) => setNewDream({ ...newDream, title: e.target.value })}
                  placeholder="Dream title..."
                  className="simple-title-input"
                  disabled={isRecording}
                />
              </div>

              <div className="dream-input-container">
                <textarea
                  value={newDream.content}
                  onChange={(e) => setNewDream({ ...newDream, content: e.target.value })}
                  placeholder="I dreamed that I was flying over a vast ocean under a starry sky. I felt both scared and excited at the same time. There was a white horse running on the water beneath me..."
                  className="simple-dream-textarea"
                  rows={10}
                  disabled={isRecording}
                />
                <div className="character-count">
                  {newDream.content.length} / 1500
                </div>
              </div>

              <div className="simple-form-footer">
                <div className="form-extras">
                  <select
                    value={newDream.mood}
                    onChange={(e) => setNewDream({ ...newDream, mood: e.target.value })}
                    className="mood-select"
                    disabled={isRecording}
                  >
                    {Object.entries(moodEmojis).map(([mood, emoji]) => (
                      <option key={mood} value={mood}>
                        {emoji} {mood.charAt(0).toUpperCase() + mood.slice(1)}
                      </option>
                    ))}
                  </select>

                  <input
                    type="text"
                    value={newDream.tags}
                    onChange={(e) => setNewDream({ ...newDream, tags: e.target.value })}
                    placeholder="tags: water, flying..."
                    className="tags-input"
                    disabled={isRecording}
                  />
                </div>
                
                <button
                  onClick={handleSaveDream}
                  disabled={!newDream.title.trim() || !newDream.content.trim() || isRecording}
                  className={`simple-record-btn ${isRecording ? 'loading' : ''}`}
                >
                  {isRecording ? (
                    <>
                      <span className="spinner">
                        <span></span>
                        <span></span>
                        <span></span>
                      </span>
                      Whisking up wisdom from your dream...
                    </>
                  ) : (
                    <>
                      Record My Dream ✨
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Quick Access to History */}
            {dreams.length > 0 && (
              <div className="quick-access">
                <button 
                  className="view-dreams-btn"
                  onClick={() => {
                    setSelectedDate(null);
                    setCurrentView('history');
                  }}
                >
                  📚 View My Dreams ({dreams.length})
                </button>
                <button 
                  className="view-calendar-btn"
                  onClick={() => setCurrentView('calendar')}
                >
                  Dream Calendar
                </button>
                {dreams.length >= 2 && (
                  <button 
                    className="view-patterns-btn"
                    onClick={() => setCurrentView('patterns')}
                  >
                    🔍 Discover Patterns
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Dream History */}
        {currentView === 'history' && (
          <div className="dream-history">
            <div className="history-header">
              <button
                className="back-btn"
                onClick={() => setCurrentView('new')}
              >
                ← Back to Recording
              </button>
              <h2 className="history-title">
                {selectedDate ? `Dreams from ${new Date(selectedDate).toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}` : 'My Dream Journal'}
              </h2>
              {selectedDate && (
                <button
                  className="clear-filter-btn"
                  onClick={clearDateFilter}
                  title="Show all dreams"
                >
                  Clear Filter
                </button>
              )}
            </div>

            {/* History Limit Notice for Free Users */}
            {userPlanInfo && !userPlanInfo.isUnlimited && (
              <div className="history-limit-notice">
                <span className="notice-icon">ℹ️</span>
                <span className="notice-text">
                  Free plan: Viewing last {userPlanInfo.historyDays} days of dreams.{' '}
                  <a href="https://gumroad.com/novakitz" target="_blank" rel="noopener noreferrer">
                    Upgrade to Premium
                  </a>
                  {' '}for full history access.
                </span>
              </div>
            )}
            
            {getFilteredDreams().length === 0 ? (
              <div className="empty-state glass">
                <span className="empty-icon">🌙</span>
                <h3>No dreams recorded yet</h3>
                <p>Start by recording your first dream to begin your journey of self-discovery.</p>
                <button
                  className="btn btn-primary"
                  onClick={() => setCurrentView('new')}
                >
                  Record Your First Dream
                </button>
              </div>
            ) : (
              <>
                <div className="dreams-grid">
                  {getPaginatedDreams().map((dream) => (
                    <div key={dream.id} className="dream-card glass glass-hover">
                      <div className="dream-card-header">
                        <div className="dream-meta">
                          <span className="dream-date">{dream.created_at ? formatTimeAgo(dream.created_at) : dream.date}</span>
                          <span className="dream-time">{dream.time}</span>
                        </div>
                        <div className="dream-actions">
                          <span className="dream-mood">{moodEmojis[dream.mood as keyof typeof moodEmojis]}</span>
                          <button
                            className="delete-btn"
                            onClick={() => dream.id && deleteDream(dream.id)}
                            title="Delete dream"
                          >
                            🗑️
                          </button>
                        </div>
                      </div>

                      <h3 className="dream-card-title">{dream.title}</h3>
                      <p className="dream-card-content">
                        {dream.content.length > 150
                          ? `${dream.content.substring(0, 150)}...`
                          : dream.content
                        }
                      </p>

                      {dream.tags.length > 0 && (
                        <div className="dream-tags">
                          {dream.tags.map((tag, index) => (
                            <span key={index} className="dream-tag">#{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Pagination Controls */}
                {getTotalPages() > 1 && (
                  <div className="pagination-controls">
                    <button
                      className="pagination-arrow"
                      onClick={goToPrevPage}
                      disabled={currentPage === 0}
                      aria-label="Previous page"
                    >
                      ‹
                    </button>

                    <div className="pagination-dots">
                      {Array.from({ length: getTotalPages() }, (_, i) => (
                        <button
                          key={i}
                          className={`pagination-dot ${currentPage === i ? 'active' : ''}`}
                          onClick={() => goToPage(i)}
                          aria-label={`Go to page ${i + 1}`}
                        />
                      ))}
                    </div>

                    <button
                      className="pagination-arrow"
                      onClick={goToNextPage}
                      disabled={currentPage === getTotalPages() - 1}
                      aria-label="Next page"
                    >
                      ›
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* Dream Calendar */}
        {currentView === 'calendar' && (
          <div className="calendar-section">
            <div className="calendar-header-nav">
              <button 
                className="back-btn"
                onClick={() => setCurrentView('new')}
              >
                ← Back to Recording
              </button>
              <h2 className="calendar-title">Dream Calendar</h2>
            </div>
            
            {dreams.length === 0 ? (
              <div className="empty-state glass">
                <span className="empty-icon">📅</span>
                <h3>No dreams to display on calendar</h3>
                <p>Start recording your dreams to see them organized by date on the calendar.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('new')}
                >
                  Record Your First Dream
                </button>
              </div>
            ) : (
              <div className="calendar-wrapper">
                <DreamCalendar 
                  dreams={dreams}
                  onDateSelect={handleDateSelect}
                  selectedDate={selectedDate}
                />
                {selectedDate && getFilteredDreams().length > 0 && (
                  <div className="selected-date-dreams">
                    <h3>Dreams from {new Date(selectedDate).toLocaleDateString()}</h3>
                    <div className="dreams-grid">
                      {getFilteredDreams().map((dream) => (
                        <div key={dream.id} className="dream-card glass glass-hover">
                          <div className="dream-card-header">
                            <div className="dream-meta">
                              <span className="dream-date">{dream.created_at ? formatTimeAgo(dream.created_at) : dream.date}</span>
                              <span className="dream-time">{dream.time}</span>
                            </div>
                            <div className="dream-actions">
                              <span className="dream-mood">{moodEmojis[dream.mood as keyof typeof moodEmojis]}</span>
                              <button 
                                className="delete-btn"
                                onClick={() => dream.id && deleteDream(dream.id)}
                                title="Delete dream"
                              >
                                🗑️
                              </button>
                            </div>
                          </div>
                          
                          <h3 className="dream-card-title">{dream.title}</h3>
                          <p className="dream-card-content">
                            {dream.content.length > 150 
                              ? `${dream.content.substring(0, 150)}...` 
                              : dream.content
                            }
                          </p>
                          
                          {dream.tags.length > 0 && (
                            <div className="dream-tags">
                              {dream.tags.map((tag, index) => (
                                <span key={index} className="dream-tag">#{tag}</span>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Patterns Analysis */}
        {currentView === 'patterns' && (
          <div className="patterns-section">
            <div className="patterns-nav">
              <button 
                className="back-btn"
                onClick={() => setCurrentView('new')}
              >
                ← Back to Recording
              </button>
            </div>
            
            {dreams.length < 2 ? (
              <div className="empty-state glass">
                <span className="empty-icon">🔍</span>
                <h3>Not enough dreams for pattern analysis</h3>
                <p>Record at least 2 dreams to start discovering patterns in your subconscious mind.</p>
                <button 
                  className="btn btn-primary"
                  onClick={() => setCurrentView('new')}
                >
                  Record More Dreams
                </button>
              </div>
            ) : (
              <div className="patterns-content">
                <div className="patterns-header">
                  <h3>Recurring Themes in Your Dreams</h3>
                  <p>Words and themes that appear frequently across your dream entries</p>
                </div>
                
                <div className="patterns-grid">
                  {findPatterns().map((pattern, index) => (
                    <div key={pattern.keyword} className="pattern-card glass glass-hover">
                      <div className="pattern-rank">#{index + 1}</div>
                      <div className="pattern-content">
                        <h4 className="pattern-keyword">{pattern.keyword}</h4>
                        <div className="pattern-stats">
                          <span className="pattern-count">Appears {pattern.count} times</span>
                          <span className="pattern-dreams">in {pattern.entries.length} dreams</span>
                        </div>
                      </div>
                      <div className="pattern-frequency">
                        <div className="frequency-bar">
                          <div 
                            className="frequency-fill"
                            style={{ width: `${(pattern.count / dreams.length) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {findPatterns().length === 0 && (
                  <div className="no-patterns glass">
                    <p>No clear patterns detected yet. Try recording a few more dreams with detailed descriptions to discover recurring themes!</p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}