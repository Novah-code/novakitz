'use client';

import { useState, useEffect, useRef } from 'react';

interface DreamEntry {
  id: string;
  text: string;
  response: string;
  date: string;
  timestamp: number;
  title?: string;
  image?: string;
  isPrivate?: boolean;
  tags?: string[];
  autoTags?: string[];
}

export default function SimpleDreamInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [novaResponse, setNovaResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const [showInput, setShowInput] = useState(false);
  const [dreamText, setDreamText] = useState('');
  const [dreamTitle, setDreamTitle] = useState('');
  const [savedDreams, setSavedDreams] = useState<DreamEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [selectedDream, setSelectedDream] = useState<DreamEntry | null>(null);
  const [editingDream, setEditingDream] = useState<DreamEntry | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editText, setEditText] = useState('');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [dreamImage, setDreamImage] = useState<string>('');
  const [editImage, setEditImage] = useState<string>('');
  const [editTags, setEditTags] = useState<string[]>([]);
  const [editAutoTags, setEditAutoTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

  // Load saved dreams from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('novaDreams');
    if (saved) {
      setSavedDreams(JSON.parse(saved));
    }
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

  const saveDreamWithTags = (dreamText: string, response: string, autoTags: string[]) => {
    console.log('saveDreamWithTags called with:', { dreamText, response, autoTags });
    const newDream: DreamEntry = {
      id: Date.now().toString(),
      text: dreamText,
      response: response,
      title: dreamTitle || 'Dream Entry',
      image: dreamImage || undefined,
      autoTags: autoTags,
      tags: [], // Empty manual tags initially
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      timestamp: Date.now()
    };
    
    console.log('Created newDream object with tags:', newDream);
    const updatedDreams = [newDream, ...savedDreams];
    console.log('Updated dreams array:', updatedDreams);
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    console.log('Saved to localStorage and updated state');
  };

  // Smoke-like turbulence animation
  useEffect(() => {
    let frame = 0;
    let animationId: number;
    
    const animateSmoke = () => {
      try {
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
  }, []);



  const handleAnalyze = async () => {
    setShowInput(true);
  };

  const analyzeDreamWithGemini = async (dreamText: string) => {
    console.log('Starting dream analysis for:', dreamText);
    
    try {
      const response = await fetch('/api/analyze-dream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          dreamText: dreamText
        })
      });

      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (!response.ok) {
        const errorData = await response.json();
        console.log('ERROR RESPONSE DETAILS:', JSON.stringify(errorData, null, 2));
        console.log('Full error object:', errorData);
        throw new Error(`API request failed with status ${response.status}: ${errorData.error || 'Unknown error'}`);
      }

      const data = await response.json();
      console.log('Dream analysis successful');

      if (data.analysis) {
        console.log('Analysis result:', data.analysis);
        console.log('Auto tags:', data.autoTags);
        return data;
      } else {
        console.log('Invalid response structure:', data);
        throw new Error(`Invalid API response structure: ${JSON.stringify(data)}`);
      }
    } catch (error) {
      console.error('Dream Analysis Error:', error);
      throw error;
    }
  };

  const handleSubmitDream = async () => {
    const trimmedText = dreamText.trim();
    if (!trimmedText || trimmedText.length < 10) {
      alert('Please describe your dream in more detail. Minimum 10 characters required. 💭');
      return;
    }
    
    setIsLoading(true);
    setShowInput(false); // Close input modal immediately
    setShowResponse(true); // Show analysis modal immediately with loading state
    setNovaResponse(''); // Clear previous response

    try {
      const result = await analyzeDreamWithGemini(dreamText);
      console.log('Analysis received in handleSubmitDream:', result);
      setNovaResponse(result.analysis);
      console.log('About to save dream with analysis:', { dreamText, result });
      saveDreamWithTags(dreamText, result.analysis, result.autoTags || []); // Save the dream with tags
      
      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
      setDreamImage(''); // Reset dream image
    } catch (error) {
      console.error('Error during dream analysis:', error);
      setNovaResponse("Dream analysis temporarily unavailable. Please try again later. ✨");
      saveDream(dreamText, "Dream analysis temporarily unavailable. Please try again later. ✨"); // Save the dream even on error
      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
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
    setEditTitle(dream.title || '');
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
            title: editTitle || 'Dream Entry', 
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

  const deleteDream = (dreamId: string) => {
    const updatedDreams = savedDreams.filter(dream => dream.id !== dreamId);
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    setActiveMenu(null);
  };

  const shareDream = (dream: DreamEntry) => {
    const shareText = `${dream.title || 'My Dream'}\n\n${dream.text}\n\nShared from novakitz`;
    if (navigator.share) {
      navigator.share({
        title: dream.title || 'My Dream',
        text: shareText
      });
    } else {
      navigator.clipboard.writeText(shareText);
      // You could add a toast notification here
    }
    setActiveMenu(null);
  };

  const togglePrivacy = (dreamId: string) => {
    const updatedDreams = savedDreams.map(dream => 
      dream.id === dreamId 
        ? { ...dream, isPrivate: !dream.isPrivate }
        : dream
    );
    
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
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
    <div>
      <style jsx global>{`
        body {
          font-family: 'Inter', sans-serif;
          background-color: #f9fafb;
          color: #1f2937;
          overflow-x: hidden;
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
          margin: 0 auto;
          position: relative;
        }
        
        .dream-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px;
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
          position: absolute;
          bottom: 20px;
          right: 20px;
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
          overflow: visible;
          border-radius: 16px 16px 0 0;
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
        }
        
        .dream-title {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 12px;
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
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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
          top: 16px;
          right: 16px;
          background: rgba(255, 255, 255, 0.2);
          border: none;
          color: white;
          width: 32px;
          height: 32px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 18px;
          transition: all 0.2s ease;
        }
        
        .dream-detail-close:hover {
          background: rgba(255, 255, 255, 0.3);
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
        }
        
        .loading-analysis {
          text-align: center;
          padding: 40px;
          background: rgba(248, 250, 252, 0.95);
          border-radius: 24px;
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid rgba(255, 255, 255, 0.5);
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
        }
        
        .matcha-brewing {
          margin: 0 auto 32px;
          display: flex;
          justify-content: center;
        }
        
        .matcha-bowl {
          filter: drop-shadow(0 8px 16px rgba(127, 176, 105, 0.2));
        }
        
        .whisk-head {
          animation: whiskStir 1.5s ease-in-out infinite !important;
        }
        
        .matcha-swirl {
          animation: swirl 4s linear infinite !important;
          transform-origin: 75px 85px !important;
        }
        
        .matcha-base {
          animation: liquidPulse 2s ease-in-out infinite !important;
        }
        
        .bubbles .bubble {
          animation: bubbleFloat 3s ease-in-out infinite !important;
        }
        
        .bubble-1 { animation-delay: 0s !important; }
        .bubble-2 { animation-delay: 0.5s !important; }
        .bubble-3 { animation-delay: 1s !important; }
        .bubble-4 { animation-delay: 1.5s !important; }
        
        @keyframes whiskStir {
          0% { transform: rotate(-20deg); }
          25% { transform: rotate(20deg); }
          50% { transform: rotate(-20deg); }
          75% { transform: rotate(20deg); }
          100% { transform: rotate(-20deg); }
        }
        
        @keyframes swirl {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes liquidPulse {
          0%, 100% { 
            opacity: 0.4; 
            transform: scale(1); 
          }
          50% { 
            opacity: 0.7; 
            transform: scale(1.03); 
          }
        }
        
        @keyframes bubbleFloat {
          0% { 
            transform: translateY(0) scale(1); 
            opacity: 0; 
          }
          20% { 
            opacity: 1; 
          }
          80% { 
            opacity: 0.8; 
            transform: translateY(-15px) scale(1.2); 
          }
          100% { 
            transform: translateY(-20px) scale(0.5); 
            opacity: 0; 
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
      `}</style>

      <div className="min-h-screen w-full flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8">
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

        
        <main className="w-full max-w-xl mx-auto z-10 flex flex-col items-center text-center">
          
          {!showInput && !showResponse && !showHistory && (
            <div className="dream-orb flex items-center justify-center mb-8 fade-in" onClick={handleAnalyze} style={{cursor: 'pointer'}}>
              <div className="orb-motion">
                <div className="smoke-base"></div>
                <div className="smoke-layer-1"></div>
                <div className="smoke-layer-2"></div>
                <div className="smoke-layer-3"></div>
              </div>
            </div>
          )}



          {showInput && (
            <div className="modal-overlay">
              <div className="modal-content">
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
                  <input
                    type="text"
                    className="dream-title-input"
                    value={dreamTitle}
                    onChange={(e) => setDreamTitle(e.target.value)}
                    placeholder="Give your dream a title..."
                  />
                  <textarea
                    className="dream-input"
                    value={dreamText}
                    onChange={(e) => setDreamText(e.target.value)}
                    placeholder=" What's brewing in your dreams? (Please write at least 10 characters)"
                    rows={4}
                    autoFocus
                  />
                  <div className={`char-counter ${dreamText.trim().length >= 10 ? 'sufficient' : ''}`}>
                    {dreamText.trim().length}/10 characters {dreamText.trim().length >= 10 ? '✓' : ''}
                  </div>
                </div>
                <div className="modal-actions">
                  <button
                    onClick={handleSubmitDream}
                    disabled={!dreamText.trim() || dreamText.trim().length < 10 || isLoading}
                    className="btn-primary"
                  >
                    {isLoading ? 'Brewing...' : 'Brew'}
                  </button>
                </div>
              </div>
            </div>
          )}


          {showHistory && savedDreams.length > 0 && (
            <div className="dream-history fade-in">
              <div className="dream-history-container">
                <div className="mb-12">
                  <div className="flex justify-between items-start mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                      Dream Journal
                    </h1>
                    
                    {/* Search and Filter Controls - Top Right */}
                    <div className="flex gap-3">
                      <div className="search-container">
                        <input
                          type="text"
                          placeholder="Search dreams..."
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
                    </div>
                  </div>
                  
                  {searchTerm || selectedTag ? (
                    <div className="mb-4 text-sm text-gray-600">
                      Showing {filteredDreams.length} of {savedDreams.length} dreams
                      {searchTerm && ` matching "${searchTerm}"`}
                      {selectedTag && ` tagged with "#${selectedTag}"`}
                    </div>
                  ) : null}
                </div>
              <div className="dream-grid">
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
                                    togglePrivacy(dream.id);
                                  }}
                                >
                                  <span className="menu-icon">
                                    {dream.isPrivate ? (
                                      <svg viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <circle cx="12" cy="7" r="4"/>
                                      </svg>
                                    ) : (
                                      <svg viewBox="0 0 24 24">
                                        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                                        <path d="M7 11V7a5 5 0 0 1 9.9-1"/>
                                      </svg>
                                    )}
                                  </span>
                                  {dream.isPrivate ? 'Make Public' : 'Make Private'}
                                </button>
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
                      </div>
                      <div className="dream-content">
                        <div className="dream-title">
                          <span className="dream-icon">📝</span>
                          <span className="dream-title-text">{dream.title || 'Dream Entry'}</span>
                        </div>
                        <div className="dream-meta">
                          {dream.date}
                        </div>
                        <div className="dream-text">
                          {dream.text}
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
                </div>
                {savedDreams.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    🌙 No dreams recorded yet
                  </div>
                )}
              </div>
              <button
                onClick={() => {setShowHistory(false);}}
                className="journal-close-btn"
              >
                Close
              </button>
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
                    placeholder="Dream title..."
                  />
                  <div 
                    className={`image-upload-container ${editImage ? 'has-image' : ''}`}
                    onClick={() => document.getElementById('edit-image-input')?.click()}
                  >
                    {editImage ? (
                      <img src={editImage} alt="Dream" className="uploaded-image" />
                    ) : (
                      <div className="upload-placeholder">
                        📸 Add or change dream image (optional)
                      </div>
                    )}
                  </div>
                  <input
                    id="edit-image-input"
                    type="file"
                    accept="image/*"
                    onChange={handleEditImageUpload}
                    className="upload-input"
                  />
                  <textarea
                    className="edit-input edit-textarea"
                    value={editText}
                    onChange={(e) => setEditText(e.target.value)}
                    placeholder="Describe your dream..."
                  />
                  
                  {/* Tags Section */}
                  <div className="tags-section">
                    <h4 className="tags-section-title">Tags</h4>
                    
                    {/* AI Auto Tags */}
                    {editAutoTags.length > 0 && (
                      <div className="tags-group">
                        <div className="tags-group-title">🤖 AI Tags</div>
                        <div className="tags-container">
                          {editAutoTags.map(tag => (
                            <span key={tag} className="tag auto-tag">
                              #{tag}
                              <button 
                                onClick={() => removeTag(tag, true)}
                                className="tag-remove"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Manual Tags */}
                    <div className="tags-group">
                      <div className="tags-group-title">✏️ Your Tags</div>
                      <div className="tags-container">
                        {editTags.map(tag => (
                          <span key={tag} className="tag manual-tag">
                            #{tag}
                            <button 
                              onClick={() => removeTag(tag, false)}
                              className="tag-remove"
                            >
                              ×
                            </button>
                          </span>
                        ))}
                      </div>
                      
                      {/* Add New Tag */}
                      <div className="add-tag-container">
                        <input
                          type="text"
                          value={newTag}
                          onChange={(e) => setNewTag(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && addNewTag()}
                          placeholder="Add new tag..."
                          className="add-tag-input"
                        />
                        <button 
                          onClick={addNewTag}
                          className="add-tag-btn"
                        >
                          Add
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="edit-actions">
                  <button onClick={cancelEditDream} className="btn-cancel">
                    Cancel
                  </button>
                  <button onClick={saveEditDream} className="btn-save">
                    Save Changes
                  </button>
                </div>
              </div>
            </div>
          )}

          {selectedDream && (
            <div className="dream-detail-overlay" onClick={() => setSelectedDream(null)}>
              <div className="dream-detail-modal" onClick={(e) => e.stopPropagation()}>
                <div className="dream-detail-header" style={{background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'}}>
                  <button className="dream-detail-close" onClick={() => setSelectedDream(null)}>
                    ×
                  </button>
                  <div className="dream-detail-title">{selectedDream.title || 'Dream Entry'}</div>
                  <div className="dream-detail-date">{selectedDream.date}</div>
                </div>
                <div className="dream-detail-body">
                  <div className="dream-detail-content">
                    {selectedDream.text}
                  </div>
                  <div className="dream-detail-response">
                    <div className="dream-detail-response-title">✨ Dream Analysis</div>
                    <div className="analysis-content">
                      {selectedDream.response.split('\n\n').map((section, index) => {
                        const trimmedSection = section.trim();
                        if (!trimmedSection) return null; // Skip empty sections
                        
                        if (trimmedSection.startsWith('DREAM SYMBOLS:')) {
                          const content = trimmedSection.replace('DREAM SYMBOLS:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">🔮 Dream Symbols</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('INNER MESSAGE:')) {
                          const content = trimmedSection.replace('INNER MESSAGE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">💝 Inner Message</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('TODAY\'S PRACTICE:')) {
                          const content = trimmedSection.replace('TODAY\'S PRACTICE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">🌱 Today's Practice</h4>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('SOMETHING TO REFLECT ON:')) {
                          const content = trimmedSection.replace('SOMETHING TO REFLECT ON:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h4 className="section-title">💭 Something to Reflect On</h4>
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
                  <div style={{textAlign: 'center', marginTop: '20px'}}>
                    <button 
                      onClick={() => {
                        setSelectedDream(null);
                        startEditDream(selectedDream);
                      }}
                      className="btn-primary"
                    >
                      Edit Dream
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {showResponse && (
            <div className="modal-overlay">
              {isLoading ? (
                <div className="loading-container">
                  <div className="loading-analysis">
                    <div className="matcha-brewing">
                      <svg width="150" height="150" viewBox="0 0 150 150" className="matcha-bowl">
                        {/* Bowl */}
                        <circle cx="75" cy="85" r="45" fill="#ffffff" stroke="#7FB069" strokeWidth="4"/>
                        
                        {/* Matcha liquid base */}
                        <circle cx="75" cy="85" r="38" fill="#7FB069" opacity="0.4" className="matcha-base"/>
                        
                        {/* Swirling matcha patterns */}
                        <g className="matcha-swirl">
                          <path 
                            d="M 40 85 Q 60 70 80 85 T 110 85" 
                            fill="none" 
                            stroke="#7FB069" 
                            strokeWidth="5" 
                            strokeLinecap="round"
                          />
                          <path 
                            d="M 45 90 Q 65 75 85 90 T 105 90" 
                            fill="none" 
                            stroke="#5A8449" 
                            strokeWidth="4" 
                            strokeLinecap="round"
                          />
                        </g>
                        
                        {/* Floating bubbles */}
                        <g className="bubbles">
                          <circle cx="60" cy="80" r="3" fill="#A8D5A8" className="bubble bubble-1"/>
                          <circle cx="85" cy="82" r="2" fill="#A8D5A8" className="bubble bubble-2"/>
                          <circle cx="90" cy="88" r="2.5" fill="#A8D5A8" className="bubble bubble-3"/>
                          <circle cx="65" cy="88" r="1.5" fill="#A8D5A8" className="bubble bubble-4"/>
                        </g>
                        
                        {/* Whisk handle */}
                        <rect x="73" y="25" width="4" height="35" fill="#8B4513" rx="2"/>
                        
                        {/* Whisk head with animation */}
                        <g className="whisk-head" style={{transformOrigin: '75px 60px'}}>
                          <path d="M 70 60 L 72 55 M 75 60 L 75 55 M 78 60 L 80 55 M 75 60 L 75 55" 
                                stroke="#8B4513" strokeWidth="2" strokeLinecap="round"/>
                        </g>
                      </svg>
                    </div>
                    <h3 className="loading-title">🍵 Brewing your dream insights...</h3>
                    <p className="loading-subtitle">Whisking up wisdom from your subconscious</p>
                  </div>
                </div>
              ) : (
                <div className="modal-content" style={{maxWidth: '600px'}}>
                  <div className="modal-body" style={{maxHeight: '60vh', overflowY: 'auto', padding: '24px'}}>
                    <div className="analysis-content">
                      {novaResponse.split('\n\n').map((section, index) => {
                        const trimmedSection = section.trim();
                        if (!trimmedSection) return null; // Skip empty sections
                        
                        if (trimmedSection.startsWith('DREAM SYMBOLS:')) {
                          const content = trimmedSection.replace('DREAM SYMBOLS:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">🔮 Dream Symbols</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('INNER MESSAGE:')) {
                          const content = trimmedSection.replace('INNER MESSAGE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">💝 Inner Message</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('TODAY\'S PRACTICE:')) {
                          const content = trimmedSection.replace('TODAY\'S PRACTICE:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">🌱 Today's Practice</h3>
                              <p className="section-text">{content}</p>
                            </div>
                          );
                        } else if (trimmedSection.startsWith('SOMETHING TO REFLECT ON:')) {
                          const content = trimmedSection.replace('SOMETHING TO REFLECT ON:', '').trim();
                          if (!content) return null; // Skip if no content
                          return (
                            <div key={index} className="analysis-section">
                              <h3 className="section-title">💭 Something to Reflect On</h3>
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
                      }).filter(Boolean)}</div>
                  )}
                </div>
                {!isLoading && (
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
                )}
              </div>
            </div>
          )}

          {!showInput && !showResponse && !showHistory && savedDreams.length > 0 && (
            <div className="mt-8 text-center">
              <button
                onClick={() => setShowHistory(true)}
                className="btn-secondary px-6 py-3 rounded-full font-medium"
              >
                View Dream Journal ({savedDreams.length})
              </button>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}