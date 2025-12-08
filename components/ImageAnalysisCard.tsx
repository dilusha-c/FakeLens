/**
 * Image Analysis Result Card
 * Displays dual analysis: AI-generated detection + OCR text fact-check
 */

'use client';

interface ImageAnalysisCardProps {
  imageData: {
    ocr: {
      text: string;
      confidence: number;
      language: string;
      hasText: boolean;
    };
    aiDetection: {
      isAIGenerated: boolean;
      confidence: number;
      likelihood: number;
      reasons: string[];
      warnings: string[];
      metadata: {
        hasEXIF: boolean;
        software?: string;
        cameraModel?: string;
      };
    };
    content: {
      safeSearch: {
        adult: string;
        violence: string;
        medical: string;
      };
      labels: Array<{ description: string; score: number }>;
      logos: Array<{ description: string; score: number }>;
    };
  };
  textAnalysis?: any; // Optional text fact-check analysis
}

export default function ImageAnalysisCard({ imageData, textAnalysis }: ImageAnalysisCardProps) {
  const { ocr, aiDetection, content } = imageData;

  const getAIVerdictColor = () => {
    if (aiDetection.likelihood >= 70) return 'text-red-500';
    if (aiDetection.likelihood >= 40) return 'text-yellow-500';
    return 'text-green-500';
  };

  const getAIVerdictText = () => {
    if (aiDetection.likelihood >= 70) return 'High Likelihood';
    if (aiDetection.likelihood >= 40) return 'Moderate Likelihood';
    return 'Low Likelihood';
  };

  return (
    <div className="space-y-4">
      {/* AI Generation Detection Card */}
      <div className="bg-gradient-to-br from-purple-50 to-blue-50 border border-purple-200 rounded-2xl p-6 shadow-sm">
        <div className="flex items-start gap-3 mb-4">
          <div className="p-2 bg-purple-100 rounded-lg">
            <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-gray-900 mb-1">🤖 AI-Generated Image Detection</h3>
            <p className="text-sm text-gray-600">Analyzing for synthetic/artificial generation indicators</p>
          </div>
        </div>

        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700">AI Generation Detection</span>
            <span className={`text-lg font-bold ${getAIVerdictColor()}`}>
              {getAIVerdictText()}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${
                aiDetection.likelihood >= 70
                  ? 'bg-red-500'
                  : aiDetection.likelihood >= 40
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
              }`}
              style={{ width: `${aiDetection.likelihood}%` }}
            />
          </div>
          <p className={`text-sm font-medium mt-2 ${getAIVerdictColor()}`}>
            {getAIVerdictText()} of AI Generation
          </p>
        </div>

        {/* Metadata Info */}
        <div className="mb-4 p-3 bg-white/70 rounded-lg">
          <h4 className="text-sm font-semibold text-gray-800 mb-2">📋 Image Metadata</h4>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Detection Method:</span>
              <span className="text-purple-700 font-medium">
                {aiDetection.reasons[0]?.includes('Sightengine') ? 'ML-Powered (Sightengine)' : 'Heuristic Analysis'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">EXIF Data:</span>
              <span className={aiDetection.metadata.hasEXIF ? 'text-green-600' : 'text-red-600'}>
                {aiDetection.metadata.hasEXIF ? '✓ Present' : '✗ Missing'}
              </span>
            </div>
            {aiDetection.metadata.software && (
              <div className="flex justify-between">
                <span className="text-gray-600">Software:</span>
                <span className="text-gray-800">{aiDetection.metadata.software}</span>
              </div>
            )}
            {aiDetection.metadata.cameraModel && (
              <div className="flex justify-between">
                <span className="text-gray-600">Camera:</span>
                <span className="text-gray-800">{aiDetection.metadata.cameraModel}</span>
              </div>
            )}
          </div>
        </div>

        {/* Reasons */}
        {aiDetection.reasons.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">🔍 Detection Reasons</h4>
            <ul className="space-y-1">
              {aiDetection.reasons.map((reason, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span className="text-gray-700">{reason}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Warnings */}
        {aiDetection.warnings.length > 0 && (
          <div>
            <h4 className="text-sm font-semibold text-gray-800 mb-2">⚠️ Analysis Notes</h4>
            <ul className="space-y-1">
              {aiDetection.warnings.map((warning, idx) => (
                <li key={idx} className="flex items-start gap-2 text-sm">
                  <span className="text-yellow-500 mt-0.5">•</span>
                  <span className="text-gray-600">{warning}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Content Labels */}
        {content.labels.length > 0 && (
          <div className="mt-4 p-3 bg-white/70 rounded-lg">
            <h4 className="text-sm font-semibold text-gray-800 mb-2">🏷️ Detected Content</h4>
            <div className="flex flex-wrap gap-2">
              {content.labels.map((label, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded-full"
                >
                  {label.description} ({Math.round(label.score * 100)}%)
                </span>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* OCR Text Extraction Card */}
      {ocr.hasText && (
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-blue-100 rounded-lg">
              <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">📝 Extracted Text (OCR)</h3>
              <p className="text-sm text-gray-600">
                Text detected with {Math.round(ocr.confidence * 100)}% confidence
                {ocr.language !== 'unknown' && ` (Language: ${ocr.language})`}
              </p>
            </div>
          </div>

          <div className="p-4 bg-white/70 rounded-lg border border-blue-200">
            <pre className="text-sm text-gray-800 whitespace-pre-wrap font-sans">
              {ocr.text}
            </pre>
          </div>

          {!textAnalysis && (
            <p className="mt-3 text-xs text-gray-500 italic">
              💡 Paste the extracted text above into the chat to fact-check it
            </p>
          )}
        </div>
      )}

      {/* Text Fact-Check Card (if text analysis exists) */}
      {textAnalysis && (
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-2xl p-6 shadow-sm">
          <div className="flex items-start gap-3 mb-4">
            <div className="p-2 bg-green-100 rounded-lg">
              <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-bold text-gray-900 mb-1">✓ Text Fact-Check Analysis</h3>
              <p className="text-sm text-gray-600">Verification of extracted text content</p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Fact-Check Result</span>
              <span className={`text-lg font-bold ${
                textAnalysis.verdict === 'fake' ? 'text-red-500' :
                textAnalysis.verdict === 'real' ? 'text-green-500' :
                'text-yellow-500'
              }`}>
                {textAnalysis.verdict === 'fake' ? 'Likely False' : 
                 textAnalysis.verdict === 'real' ? 'Likely True' :
                 'Uncertain'}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all ${
                  textAnalysis.verdict === 'fake' ? 'bg-red-500' :
                  textAnalysis.verdict === 'real' ? 'bg-green-500' :
                  'bg-yellow-500'
                }`}
                style={{ width: `${textAnalysis.confidence * 100}%` }}
              />
            </div>
            <p className={`text-sm font-medium mt-2 ${
              textAnalysis.verdict === 'fake' ? 'text-red-500' :
              textAnalysis.verdict === 'real' ? 'text-green-500' :
              'text-yellow-500'
            }`}>
              Verdict: {textAnalysis.verdict.toUpperCase()}
            </p>
          </div>

          {textAnalysis.reasons && textAnalysis.reasons.length > 0 && (
            <div>
              <h4 className="text-sm font-semibold text-gray-800 mb-2">📌 Analysis Reasons</h4>
              <ul className="space-y-1">
                {textAnalysis.reasons.map((reason: string, idx: number) => (
                  <li key={idx} className="flex items-start gap-2 text-sm">
                    <span className="text-green-500 mt-0.5">•</span>
                    <span className="text-gray-700">{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {!ocr.hasText && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4">
          <p className="text-sm text-yellow-800">
            ℹ️ No text detected in this image. The AI generation analysis above is based on visual characteristics and metadata.
          </p>
        </div>
      )}
    </div>
  );
}
