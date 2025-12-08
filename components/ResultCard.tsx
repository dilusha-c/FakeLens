'use client';

import { Analysis, Verdict } from '@/types';

interface ResultCardProps {
  analysis: Analysis;
}

export default function ResultCard({ analysis }: ResultCardProps) {
  const { verdict, confidence, reasons, supportLinks, debunkLinks } = analysis;

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
          bg: 'bg-red-50',
          border: 'border-red-200',
          text: 'text-red-700',
          badge: 'bg-red-100 text-red-800',
          bar: 'bg-red-500',
        };
      case 'real':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          text: 'text-green-700',
          badge: 'bg-green-100 text-green-800',
          bar: 'bg-green-500',
        };
      case 'uncertain':
        return {
          bg: 'bg-yellow-50',
          border: 'border-yellow-200',
          text: 'text-yellow-700',
          badge: 'bg-yellow-100 text-yellow-800',
          bar: 'bg-yellow-500',
        };
      case 'unanalyzable':
        return {
          bg: 'bg-gray-50',
          border: 'border-gray-200',
          text: 'text-gray-700',
          badge: 'bg-gray-100 text-gray-800',
          bar: 'bg-gray-400',
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
    <div className={`mt-4 ml-11 rounded-xl border-2 ${colors.border} ${colors.bg} p-6 shadow-sm`}>
      {/* Verdict Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <span className={`px-3 py-1 rounded-full text-sm font-semibold ${colors.badge}`}>
            {verdictLabel}
          </span>
          <span className={`text-sm font-medium ${colors.text}`}>
            {Math.round(confidence * 100)}% confidence
          </span>
        </div>
      </div>

      {/* Verdict Indicator */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Verdict</span>
          <span className="text-sm font-bold text-gray-900">
            {verdict === 'fake' ? '⚠️ Likely False' : 
             verdict === 'real' ? '✓ Likely True' :
             verdict === 'unanalyzable' ? 'ℹ️ Cannot be analyzed' :
             '? Uncertain'}
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full ${colors.bar} transition-all duration-500`}
            style={{ width: `${fakeLikelihood}%` }}
          />
        </div>
      </div>

      {/* Reasons */}
      {reasons.length > 0 && (
        <div className="mb-6">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">Analysis Reasons</h4>
          <ul className="space-y-2">
            {reasons.map((reason, index) => (
              <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                <span className="text-gray-400 mt-0.5">•</span>
                <span>{reason}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Evidence Links */}
      {(supportLinks.length > 0 || debunkLinks.length > 0) && (
        <div className="space-y-4">
          {supportLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-green-600">✓</span>
                Supporting Sources
              </h4>
              <div className="space-y-2">
                {supportLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-green-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {link.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">{link.source}</p>
                  </a>
                ))}
              </div>
            </div>
          )}

          {debunkLinks.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <span className="text-blue-600">ℹ️</span>
                Fact Checks & Debunking Sources
              </h4>
              <div className="space-y-2">
                {debunkLinks.map((link, index) => (
                  <a
                    key={index}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-sm transition-all"
                  >
                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                      {link.title}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-gray-500">{link.source}</p>
                      {link.rating && (
                        <>
                          <span className="text-xs text-gray-300">•</span>
                          <span className="text-xs font-medium text-blue-600">
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
      <div className="mt-6 pt-4 border-t border-gray-200">
        <p className="text-xs text-gray-500 italic">
          ⚠️ This is an automated estimation. Please verify with official sources and use critical thinking.
        </p>
      </div>
    </div>
  );
}
