'use client';

import { useState, useEffect, useRef } from 'react';

export default function SimpleDreamInterface() {
  const [dreamKeywords, setDreamKeywords] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [novaResponse, setNovaResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

  // Smooth turbulence animation
  useEffect(() => {
    let frame = 0;
    const animateTurbulence = () => {
      if (turbulenceRef.current) {
        const time = frame * 0.0005;
        const freqX = 0.012 + Math.sin(time) * 0.006;
        const freqY = 0.018 + Math.cos(time * 1.1) * 0.007;
        turbulenceRef.current.setAttribute("baseFrequency", `${freqX} ${freqY}`);
      }
      frame++;
      requestAnimationFrame(animateTurbulence);
    };
    animateTurbulence();
  }, []);

  // Particle background
  useEffect(() => {
    const particleContainer = document.getElementById('particle-container');
    if (particleContainer) {
      // Clear existing particles
      particleContainer.innerHTML = '';
      
      for (let i = 0; i < 50; i++) {
        const particle = document.createElement('div');
        particle.className = 'particle';
        const size = Math.random() * 2 + 0.5;
        particle.style.width = `${size}px`;
        particle.style.height = `${size}px`;
        particle.style.top = `${Math.random() * 100}%`;
        particle.style.left = `${Math.random() * 100}%`;
        particle.style.animationDelay = `${Math.random() * 20}s`;
        particle.style.animationDuration = `${Math.random() * 15 + 15}s`;
        particleContainer.appendChild(particle);
      }
    }
  }, []);

  const adjustColor = (color: string, amount: number): string => {
    if (!color || typeof color !== 'string' || color.length < 7) return '#F7F3E9';
    return '#' + color.replace(/^#/, '').replace(/../g, c => 
      ('0' + Math.min(255, Math.max(0, parseInt(c, 16) + amount)).toString(16)).substr(-2)
    );
  };

  const handleAnalyze = async () => {
    if (!dreamKeywords.trim()) {
      alert('Spill your dream tea! Please enter some keywords.');
      return;
    }

    setIsLoading(true);
    setShowResponse(false);

    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNovaResponse(`Okay bestie, here's the tea... 🍵 Your dreams about "${dreamKeywords}" are brewing with creative energy! ✨ This suggests your subconscious is processing new ideas and possibilities. 🌱 Trust the process and let your imagination flow! 🌙`);
      setShowResponse(true);
    } catch (error) {
      console.error('Error during dream analysis:', error);
      setNovaResponse("Sorry bestie, the tea leaves are a bit cloudy right now. Please try again later.");
      setShowResponse(true);
    } finally {
      setIsLoading(false);
    }
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
        
        .orb-gradient {
          position: absolute;
          top: -10%; left: -10%;
          width: 120%; height: 120%;
          background: 
            radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9) 0%, rgba(127, 176, 105, 0.6) 30%, transparent 70%),
            radial-gradient(circle at 70% 80%, rgba(168, 213, 168, 0.8) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 80%),
            linear-gradient(135deg, rgba(247, 243, 233, 0.7), rgba(168, 213, 168, 0.5), rgba(127, 176, 105, 0.3));
          animation: gradientFlow 15s ease-in-out infinite;
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

        @keyframes gradientFlow {
          0% { 
            transform: rotate(0deg) scale(1);
            background: 
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9) 0%, rgba(127, 176, 105, 0.6) 30%, transparent 70%),
              radial-gradient(circle at 70% 80%, rgba(168, 213, 168, 0.8) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 80%),
              linear-gradient(135deg, rgba(247, 243, 233, 0.7), rgba(168, 213, 168, 0.5));
          }
          33% {
            transform: rotate(120deg) scale(1.03);
            background: 
              radial-gradient(circle at 80% 50%, rgba(255, 255, 255, 0.8) 0%, rgba(168, 213, 168, 0.7) 35%, transparent 75%),
              radial-gradient(circle at 20% 30%, rgba(127, 176, 105, 0.6) 0%, rgba(255, 255, 255, 0.5) 45%, transparent 85%),
              linear-gradient(225deg, rgba(168, 213, 168, 0.6), rgba(247, 243, 233, 0.4));
          }
          66% {
            transform: rotate(240deg) scale(0.97);
            background: 
              radial-gradient(circle at 50% 90%, rgba(247, 243, 233, 0.9) 0%, rgba(135, 169, 107, 0.5) 32%, transparent 72%),
              radial-gradient(circle at 40% 10%, rgba(255, 255, 255, 0.7) 0%, rgba(168, 213, 168, 0.6) 38%, transparent 78%),
              linear-gradient(315deg, rgba(135, 169, 107, 0.4), rgba(255, 255, 255, 0.6));
          }
          100% { 
            transform: rotate(360deg) scale(1);
            background: 
              radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.9) 0%, rgba(127, 176, 105, 0.6) 30%, transparent 70%),
              radial-gradient(circle at 70% 80%, rgba(168, 213, 168, 0.8) 0%, rgba(255, 255, 255, 0.4) 40%, transparent 80%),
              linear-gradient(135deg, rgba(247, 243, 233, 0.7), rgba(168, 213, 168, 0.5));
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
        
        .particle {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.3);
          backdrop-filter: blur(8px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          animation: float 20s ease-in-out infinite;
          pointer-events: none;
        }
        
        @keyframes float {
          0% { transform: translateY(0px); opacity: 0.7; }
          50% { transform: translateY(-20px); opacity: 0.3; }
          100% { transform: translateY(0px); opacity: 0.7; }
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
              scale="120" 
              xChannelSelector="R" 
              yChannelSelector="G" 
            />
            <feGaussianBlur stdDeviation="0.5" result="blur"/>
            <feComposite in="SourceGraphic" in2="blur" operator="screen"/>
          </filter>
        </svg>

        <div id="particle-container" className="absolute inset-0 z-0 overflow-hidden"></div>
        
        <main className="w-full max-w-xl mx-auto z-10 flex flex-col items-center text-center">
          
          <div className="dream-orb flex items-center justify-center mb-8 fade-in">
            <div className="orb-motion">
              <div className="orb-gradient"></div>
              <div className="orb-layer-1"></div>
              <div className="orb-layer-2"></div>
            </div>
            <span className="text-xl font-bold text-white text-center transition-opacity duration-500 drop-shadow-xl z-20 relative">
              {showResponse ? "Click to see the message" : "What's your dream?"}
            </span>
          </div>

          <div className="w-full glass-pane p-6 rounded-2xl fade-in" style={{animationDelay: '0.5s'}}>
            <h1 className="text-3xl sm:text-4xl font-black matcha-gradient-text mb-4">
              Nova Kitz - What's brewing in your dreams?
            </h1>
            <div className="flex flex-col sm:flex-row gap-4">
              <input 
                type="text" 
                value={dreamKeywords}
                onChange={(e) => setDreamKeywords(e.target.value)}
                placeholder="e.g., flying, ocean, white horse" 
                className="w-full px-4 py-3 rounded-lg border-2 border-stone-300 focus:ring-2 focus:ring-green-400 focus:border-green-400 transition duration-300 bg-white/80 placeholder-stone-400 text-stone-700"
                onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
              />
              <button 
                onClick={handleAnalyze}
                disabled={isLoading}
                className="w-full sm:w-auto px-6 py-3 rounded-lg font-bold matcha-btn whitespace-nowrap flex items-center justify-center gap-2"
              >
                <span className={isLoading ? 'hidden' : ''}>Brew Analysis</span>
                <div className={`spinner ${isLoading ? '' : 'hidden'}`}></div>
              </button>
            </div>
          </div>

          {showResponse && (
            <div className="w-full mt-6 glass-pane p-6 rounded-2xl text-left flex items-start space-x-4 fade-in">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-green-200 to-green-300 flex-shrink-0 flex items-center justify-center text-2xl backdrop-blur-sm border border-white/30">
                <svg viewBox="0 0 563.85 348.04" className="w-8 h-8" fill="currentColor">
                  <path d="M166,14.08a17.05,17.05,0,0,0-9.54,1.14c-4.95,2.24-7.34,6.61-8.25,8.29-8.53,15.59-2.49,71.16-1.41,102,.4,11.62.16,21.38-.17,28.44,0,0-6.91,0-9.41,0-2.72,0-9.56-.27-12.27-.23,0,0-37.21-55.34-50.18-69.66Q58.93,66.37,43.53,50.74a101.63,101.63,0,0,0,1.63,28.79c6.16,30.37,24.32,53.86,33.17,61.95,0,1.19.22,10.85.18,12.28-1.38,0-40.34.23-58.49,0,0-1.45.23-12.28.23-12.28s15.8-15.25,16.36-61.62c.09-7.35-1.87-24.23-13-42a79.19,79.19,0,0,0-23-23.53c0-.35-.36-1.76-.35-2.12A77.47,77.47,0,0,0,0,2c20.25.07,40.65-.07,60.9,0,23.45,28.57,46.72,57.66,70.17,86.23.81-15.5,1-28.62.87-38.65-.05-6.08.15-17.19-5.57-25.95a21,21,0,0,0-6.28-6.41,19.1,19.1,0,0,0-12.57-2.89L107.66,2C127.2,1.64,166,2,166,2c0,1.61.06,3.24.08,4.89Q166.09,10.55,166,14.08Z"/>
                  <path d="M310.86,92.51q-3.08-26.12-15.06-41.82T268.14,29.18a88.83,88.83,0,0,0-30.92-5.79,74,74,0,0,0-7.87.42c-.58.09-1.27.18-2.09.28a8,8,0,0,0-2,.42,88.9,88.9,0,0,0-34.73,15.36q-15.42,11.31-22.37,27.51a85.59,85.59,0,0,0-6.95,34.07,128.41,128.41,0,0,0,.74,13.41q3.57,26.8,15.49,42.45t27.23,21a89.43,89.43,0,0,0,29.69,5.37q4.55,0,9.1-.42.36,0,1.29-.06a11.39,11.39,0,0,0,1.78-.28,5.93,5.93,0,0,1,1.23-.21,89.64,89.64,0,0,0,34.67-14.88,63.47,63.47,0,0,0,22.25-27.23,87.71,87.71,0,0,0,6.88-34.56A132.27,132.27,0,0,0,310.86,92.51ZM259.1,158.43q-3.69,16.33-12.54,22.34a3,3,0,0,1-1.48.28h-1.59q-9.72-3.63-16.91-18.29t-11.37-35.19Q211,107,210.72,95.1t-.3-14.74a149.39,149.39,0,0,1,3.07-31.7Q217,32.33,225.41,25.9a4.82,4.82,0,0,1,1.6-.7,6.86,6.86,0,0,1,1.11-.14,2.29,2.29,0,0,1,1.11.28q9.59,3.63,16.84,18.44t11.49,35.47q4.24,20.67,4.55,32.68t.31,14.66A139.64,139.64,0,0,1,259.1,158.43Z"/>
                </svg>
              </div>
              <div>
                <p className="font-bold text-lg matcha-gradient-text">Nova's Message:</p>
                <p className="mt-2 text-lg text-stone-700 whitespace-pre-wrap">{novaResponse}</p>
              </div>
            </div>
          )}

          <footer className="mt-12 text-center text-stone-500 fade-in" style={{animationDelay: '1s'}}>
            <p>Made with dreams and good vibes ✨</p>
          </footer>
        </main>
      </div>
    </>
  );
}