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
    const newDream: DreamEntry = {
      id: Date.now().toString(),
      text: dreamText,
      response: response,
      title: dreamTitle || 'Dream Entry',
      image: dreamImage || undefined,
      date: new Date().toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      timestamp: Date.now()
    };
    
    const updatedDreams = [newDream, ...savedDreams];
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
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
    const prompt = `당신은 칼 융의 분석심리학을 전문으로 하는 꿈 해석가입니다. 다음 꿈을 친근하고 이해하기 쉽게 분석해주세요.

꿈 내용: "${dreamText}"

다음 형식으로 분석해주세요:

🔮 **첫인상과 전체적 분위기**
꿈의 전반적인 느낌과 감정을 간단히 설명해주세요.

💫 **주요 상징들의 의미**
꿈에 나타난 중요한 인물, 장소, 사물들이 당신의 내면에서 무엇을 의미하는지 설명해주세요.

⚖️ **마음의 균형과 메시지**
현재 당신의 의식과 무의식이 전하고자 하는 메시지를 설명해주세요.

🌱 **성장을 위한 힌트**
이 꿈이 당신의 개인적 성장과 자기실현을 위해 주는 조언을 알려주세요.

✨ **일상에서의 실천**
꿈의 메시지를 일상생활에서 어떻게 활용할 수 있는지 구체적인 제안을 해주세요.

전문 용어는 피하고, 마치 친구가 대화하듯 따뜻하고 이해하기 쉽게 설명해주세요.`;

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=AIzaSyBsiF34-AwEm1S9Ya8_QUppgMZQSf1tA1U`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [{
            parts: [{
              text: prompt
            }]
          }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      console.log('API Response:', data); // 디버깅용 로그

      if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0]) {
        return data.candidates[0].content.parts[0].text;
      } else {
        throw new Error('Invalid API response structure');
      }
    } catch (error) {
      console.error('Gemini API Error:', error);
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
    setShowResponse(false);

    try {
      const analysis = await analyzeDreamWithGemini(dreamText);
      setNovaResponse(analysis);
      setShowInput(false); // Close the input modal
      saveDream(dreamText, analysis); // Save the dream
      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
      setDreamImage(''); // Reset dream image
      setShowHistory(true); // Show dream journal directly
    } catch (error) {
      console.error('Error during dream analysis:', error);
      setNovaResponse("Dream analysis temporarily unavailable. Please try again later. ✨");
      setShowInput(false); // Close the input modal even on error
      saveDream(dreamText, "Dream analysis temporarily unavailable. Please try again later. ✨"); // Save the dream even on error
      setDreamText(''); // Reset dream text
      setDreamTitle(''); // Reset dream title
      setDreamImage(''); // Reset dream image
      setShowHistory(true); // Show dream journal even on error
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
    setSelectedDream(null); // Close detail modal
  };

  const saveEditDream = () => {
    if (!editingDream) return;
    
    const updatedDreams = savedDreams.map(dream => 
      dream.id === editingDream.id 
        ? { ...dream, title: editTitle || 'Dream Entry', text: editText, image: editImage || undefined }
        : dream
    );
    
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    
    // Reset edit state
    setEditingDream(null);
    setEditTitle('');
    setEditText('');
  };

  const cancelEditDream = () => {
    setEditingDream(null);
    setEditTitle('');
    setEditText('');
    setEditImage('');
  };

  const deleteDream = (dreamId: string) => {
    const updatedDreams = savedDreams.filter(dream => dream.id !== dreamId);
    setSavedDreams(updatedDreams);
    localStorage.setItem('novaDreams', JSON.stringify(updatedDreams));
    setActiveMenu(null);
  };

  const shareDream = (dream: DreamEntry) => {
    const shareText = `${dream.title || 'My Dream'}\n\n${dream.text}\n\nShared from Nova Kitz`;
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

  return (
    <>
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
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Dream Journal
                  </h1>
                </div>
              <div className="dream-grid">
                {savedDreams.slice(0, 9).map((dream, index) => {
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
                    <div key={dream.id} className="dream-entry" onClick={() => startEditDream(dream)}>
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
                    <div className="dream-detail-response-text">
                      {selectedDream.response}
                    </div>
                  </div>
                </div>
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
    </>
  );
}