'use client';

import { useState, useEffect } from 'react';
import { Analysis, Verdict } from '@/types';

interface ResultCardProps {
  analysis: Analysis;
}

export default function ResultCard({ analysis }: ResultCardProps) {
  const { verdict, confidence, reasons, supportLinks, debunkLinks } = analysis;
  const [isRevealed, setIsRevealed] = useState(false);
  const [animatedConfidence, setAnimatedConfidence] = useState(0);

  // Trigger reveal animation on mount
  useEffect(() => {
    const revealTimer = setTimeout(() => setIsRevealed(true), 100);
    return () => clearTimeout(revealTimer);
  }, []);

  // Animate confidence percentage
  useEffect(() => {
    if (isRevealed) {
      const targetConfidence = Math.round(confidence * 100);
      let current = 0;
      const increment = Math.ceil(targetConfidence / 30);
      const timer = setInterval(() => {
        current += increment;
        if (current >= targetConfidence) {
          setAnimatedConfidence(targetConfidence);
          clearInterval(timer);
        } else {
          setAnimatedConfidence(current);
        }
      }, 30);
      return () => clearInterval(timer);
    }
  }, [isRevealed, confidence]);

  // Calculate fake likelihood percentage
  const fakeLikelihood = verdict === 'fake' 
    ? Math.round(confidence * 100)
    : verdict === 'real'
    ? Math.round((1 - confidence) * 100)
    : 50;

  // Determine colors based on verdict
  const getVerdictColor = (v: Verdict) => {
    switch (v) {
      case 'fake':
        return {
          badge: 'bg-white/5 border border-red-500/30 text-red-200',
          text: 'text-red-200',
          bar: 'bg-gradient-to-r from-red-500 to-pink-600',
          icon: 'text-red-400',
        };
      case 'real':
        return {
          badge: 'bg-white/5 border border-green-500/30 text-green-200',
          text: 'text-green-200',
          bar: 'bg-gradient-to-r from-emerald-500 to-lime-400',
          icon: 'text-green-400',
        };
      case 'uncertain':
        return {
          badge: 'bg-white/5 border border-yellow-400/40 text-yellow-200',
          text: 'text-yellow-200',
          bar: 'bg-gradient-to-r from-amber-500 to-orange-500',
          icon: 'text-yellow-300',
        };
      case 'unanalyzable':
        return {
          badge: 'bg-white/5 border border-white/20 text-white/70',
          text: 'text-white/80',
          bar: 'bg-white/30',
          icon: 'text-white/60',
        };
    }
  };

  const colors = getVerdictColor(verdict);

  const verdictLabel = verdict === 'fake' 
    ? 'Likely Fake'
    : verdict === 'real'
    ? 'Likely Real'
    : verdict === 'unanalyzable'
    ? 'Cannot be analyzed'
    : 'Uncertain';

  return (
    <div className={`mt-3 sm:mt-4 w-full sm:max-w-[80%] bg-gradient-to-br from-[#131522] to-[#0e1724] border border-white/10 rounded-xl sm:rounded-2xl p-4 sm:p-6 shadow-sm transition-all duration-500 ${isRevealed ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
      {/* Header with Icon */}
      <div className="flex items-start gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="p-1.5 sm:p-2 bg-white/5 rounded-lg flex-shrink-0">
          <svg className="w-5 h-5 sm:w-6 sm:h-6 text-[var(--accent-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base sm:text-lg font-bold text-white mb-0.5 sm:mb-1">📊 Content Analysis</h3>
          <p className="text-xs sm:text-sm text-white/70">AI-powered fact-checking</p>
        </div>
      </div>

      {/* Verdict Badge */}
      <div className="flex flex-wrap items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <span className={`px-2.5 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-semibold ${colors.badge} shadow-sm transition-all duration-300 ${isRevealed ? 'scale-100' : 'scale-0'}`}>
          {verdictLabel}
        </span>
        <span className={`text-xs sm:text-sm font-medium ${colors.text} transition-all duration-500 delay-100 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
          {animatedConfidence}% confidence
        </span>
      </div>

      {/* Verdict Indicator */}
      <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10 transition-all duration-500 delay-200 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
        <div className="flex items-center justify-between mb-2 gap-2">
          <span className="text-xs sm:text-sm font-medium text-white/80">Verdict</span>
          <span className={`text-sm sm:text-lg font-bold ${colors.icon} text-right`}>
            {verdict === 'fake' ? '⚠️ Likely False' : 
             verdict === 'real' ? '✓ Likely True' :
             verdict === 'unanalyzable' ? 'ℹ️ Cannot analyze' :
             '? Uncertain'}
          </span>
        </div>
        <div className="w-full bg-white/10 rounded-full h-2.5 sm:h-3">
          <div
            className={`h-2.5 sm:h-3 rounded-full ${colors.bar} transition-all duration-1000 ease-out`}
            style={{ width: isRevealed ? `${fakeLikelihood}%` : '0%' }}
          />
        </div>
        <div className="flex justify-between mt-1 text-xs text-white/70">
          <span>Real</span>
          <span>Fake</span>
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className={`mb-3 sm:mb-4 p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10 transition-all duration-500 delay-300 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
          <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 sm:mb-3">🔍 Analysis Reasons</h4>
          <ul className="space-y-1.5 sm:space-y-2">
            {reasons.map((reason, index) => (
              <li 
                key={index} 
                className={`flex items-start gap-2 text-xs sm:text-sm text-white/90 transition-all duration-300`}
                style={{ 
                  transitionDelay: `${400 + (index * 100)}ms`,
                  opacity: isRevealed ? 1 : 0,
                  transform: isRevealed ? 'translateX(0)' : 'translateX(-10px)'
                }}
              >
                <span className="text-white/60 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence Links */}
      {(supportLinks.length > 0 || debunkLinks.length > 0) && (
        <div className={`space-y-2 sm:space-y-3 transition-all duration-500 delay-500 ${isRevealed ? 'opacity-100' : 'opacity-0'}`}>
          {supportLinks.length > 0 && (
            <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-green-400">✓</span>
                Supporting Sources
              </h4>
              <div className="space-y-1.5 sm:space-y-2">
                {supportLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 sm:p-2.5 bg-white/5 rounded-lg border border-white/10 hover:border-green-400/50 hover:bg-white/10 transition-all touch-manipulation"
                  >
                    <p className="text-xs sm:text-sm font-medium text-white line-clamp-2">
                      {link.title}
                    </p>
                    <p className="text-xs text-white/70 mt-0.5 sm:mt-1 truncate">{link.source}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {debunkLinks.length > 0 && (
            <div className="p-2.5 sm:p-3 bg-white/5 rounded-lg border border-white/10">
              <h4 className="text-xs sm:text-sm font-semibold text-white mb-2 flex items-center gap-2">
                <span className="text-blue-300">ℹ️</span>
                Fact Checks & Debunking Sources
              </h4>
              <div className="space-y-1.5 sm:space-y-2">
                {debunkLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-2 sm:p-2.5 bg-white/5 rounded-lg border border-white/10 hover:border-blue-300/50 hover:bg-white/10 transition-all touch-manipulation"
                  >
                    <p className="text-xs sm:text-sm font-medium text-white line-clamp-2">
                      {link.title}
                    </p>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-0.5 sm:mt-1">
                      <p className="text-xs text-white/70 truncate max-w-[60%]">{link.source}</p>
                      {link.rating && (
                        <>
                          <span className="text-xs text-white/40">•</span>
                          <span className="text-xs font-medium text-blue-300">
                            {link.rating}
                          </span>
                        </>
                      )}
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Disclaimer */}
      <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-white/10">
        <p className="text-xs text-white/60 italic flex items-start gap-1.5 sm:gap-2">
          <span className="text-white/40 flex-shrink-0">⚠️</span>
          <span>This is an automated estimation. Please verify with official sources and use critical thinking.</span>
        </p>
      </div>
    </div>
  );
}
