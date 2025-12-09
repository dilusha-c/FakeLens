'use client';

import { DocumentAnalysisData } from '@/types';

interface DocumentAnalysisCardProps {
  data: DocumentAnalysisData;
}

export default function DocumentAnalysisCard({ data }: DocumentAnalysisCardProps) {
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getFileIcon = (fileType: string): string => {
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('text')) return '📃';
    return '📋';
  };

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-6 space-y-4 border border-purple-200">
      <div className="flex items-center gap-3 pb-3 border-b border-purple-200">
        <span className="text-4xl">{getFileIcon(data.metadata.fileType)}</span>
        <div className="flex-1">
          <h3 className="font-bold text-purple-900 text-lg">Document Analysis</h3>
          <p className="text-sm text-purple-600">{data.metadata.fileName}</p>
        </div>
      </div>

      {/* Document Metadata */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">File Size</p>
          <p className="font-semibold text-purple-900">{formatFileSize(data.metadata.fileSize)}</p>
        </div>
        
        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Words</p>
          <p className="font-semibold text-purple-900">{data.metadata.wordCount.toLocaleString()}</p>
        </div>

        {data.metadata.pageCount && (
          <div className="bg-white/70 rounded-lg p-3">
            <p className="text-xs text-gray-600 mb-1">Pages</p>
            <p className="font-semibold text-purple-900">{data.metadata.pageCount}</p>
          </div>
        )}

        <div className="bg-white/70 rounded-lg p-3">
          <p className="text-xs text-gray-600 mb-1">Characters</p>
          <p className="font-semibold text-purple-900">{data.metadata.charCount.toLocaleString()}</p>
        </div>
      </div>

      {/* Text Preview */}
      <div className="bg-white/70 rounded-lg p-4">
        <p className="text-xs text-gray-600 mb-2 font-semibold">Extracted Text Preview</p>
        <div className="max-h-48 overflow-y-auto">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {data.text.substring(0, 500)}
            {data.text.length > 500 && '...'}
          </p>
        </div>
      </div>

      {/* Analysis Results */}
      {data.analysis && (
        <div className="bg-white/70 rounded-lg p-4 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-bold text-purple-900">Fact-Check Results</h4>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              data.analysis.verdict === 'real' 
                ? 'bg-green-100 text-green-800'
                : data.analysis.verdict === 'fake'
                ? 'bg-red-100 text-red-800'
                : data.analysis.verdict === 'uncertain'
                ? 'bg-yellow-100 text-yellow-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {data.analysis.verdict === 'unanalyzable' 
                ? 'Cannot be analyzed'
                : data.analysis.verdict.toUpperCase()
              }
            </span>
          </div>

          {data.analysis.reasons.length > 0 && (
            <div>
              <p className="text-xs text-gray-600 mb-2 font-semibold">Key Findings:</p>
              <ul className="space-y-1">
                {data.analysis.reasons.map((reason, idx) => (
                  <li key={idx} className="text-sm text-gray-700 flex items-start gap-2">
                    <span className="text-purple-600 mt-1">•</span>
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {(data.analysis.supportLinks.length > 0 || data.analysis.debunkLinks.length > 0) && (
            <div className="space-y-2">
              {data.analysis.supportLinks.length > 0 && (
                <div>
                  <p className="text-xs text-green-700 font-semibold mb-1">Supporting Evidence:</p>
                  <div className="space-y-1">
                    {data.analysis.supportLinks.slice(0, 3).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block truncate"
                      >
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {data.analysis.debunkLinks.length > 0 && (
                <div>
                  <p className="text-xs text-red-700 font-semibold mb-1">Contradicting Evidence:</p>
                  <div className="space-y-1">
                    {data.analysis.debunkLinks.slice(0, 3).map((link, idx) => (
                      <a
                        key={idx}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-xs text-blue-600 hover:underline block truncate"
                      >
                        {link.title || link.url}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="text-xs text-purple-600 text-center pt-2">
        📄 Document processed and analyzed for factual accuracy
      </div>
    </div>
  );
}
