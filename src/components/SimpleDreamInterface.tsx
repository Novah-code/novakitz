'use client';

import { useState, useEffect, useRef } from 'react';

export default function SimpleDreamInterface() {
  const [isLoading, setIsLoading] = useState(false);
  const [novaResponse, setNovaResponse] = useState('');
  const [showResponse, setShowResponse] = useState(false);
  const turbulenceRef = useRef<SVGFETurbulenceElement>(null);

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
    setIsLoading(true);
    setShowResponse(false);

    try {
      // Simulate API call for now
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      setNovaResponse(`Welcome to Nova Dreams ✨ Your journey into dream interpretation begins here. Click the orb to explore the mysteries of your subconscious mind! 🌙`);
      setShowResponse(true);
    } catch (error) {
      console.error('Error during dream analysis:', error);
      setNovaResponse("The dream realm is temporarily unavailable. Please try again later.");
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
            <feComposite in="SourceGraphic" in2="smokeBlur" operator="multiply"/>
          </filter>
        </svg>

        
        <main className="w-full max-w-xl mx-auto z-10 flex flex-col items-center text-center">
          
          <div className="dream-orb flex items-center justify-center mb-8 fade-in" onClick={handleAnalyze} style={{cursor: 'pointer'}}>
            <div className="orb-motion">
              <div className="smoke-base"></div>
              <div className="smoke-layer-1"></div>
              <div className="smoke-layer-2"></div>
              <div className="smoke-layer-3"></div>
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

        </main>
      </div>
    </>
  );
}