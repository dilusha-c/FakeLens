'use client';

import { useState } from 'react';
import { Analysis } from '@/types';
import { detectPersonalInfo, createPersonalInfoMessage } from '@/lib/personalInfoDetector';

interface ChatInputProps {
  onSend: (message: string) => void;
  onImageUpload?: (imageData: any, imageFile: File) => void;
  onDocumentUpload?: (documentData: any, documentFile: File) => void;
  disabled: boolean;
  hasAnalysis: boolean;
  currentAnalysis?: Analysis;
}

export default function ChatInput({ onSend, onImageUpload, onDocumentUpload, disabled, hasAnalysis, currentAnalysis }: ChatInputProps) {
  const MIN_CHARACTERS = 15;
  const [input, setInput] = useState('');
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [isSharing, setIsSharing] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [uploadingDocument, setUploadingDocument] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [selectedDocument, setSelectedDocument] = useState<File | null>(null);
  const [detectedInfo, setDetectedInfo] = useState<Array<{ type: string; value: string }> | null>(null);
  const [showPersonalInfoWarning, setShowPersonalInfoWarning] = useState(false);

  const characterCount = input.trim().length;
  const isValidLength = characterCount >= MIN_CHARACTERS;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedInput = input.trim();
    
    if (!trimmedInput || disabled) return;
    
    // Check minimum character requirement
    if (trimmedInput.length < MIN_CHARACTERS) {
      return; // Button is disabled, but extra safety check
    }
    
    // Check for personal information
    const detected = detectPersonalInfo(trimmedInput);
    
    if (detected.length > 0) {
      setDetectedInfo(detected);
      setShowPersonalInfoWarning(true);
    } else {
      onSend(trimmedInput);
      setInput('');
    }
  };

  const handleContinueWithInfo = () => {
    onSend(input.trim());
    setInput('');
    setDetectedInfo(null);
    setShowPersonalInfoWarning(false);
  };

  const handleCancelMessage = () => {
    setDetectedInfo(null);
    setShowPersonalInfoWarning(false);
  };

  const handleShare = async () => {
    if (!currentAnalysis) return;

    setIsSharing(true);
    try {
      const response = await fetch('/api/report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ analysis: currentAnalysis }),
      });

      if (response.ok) {
        const data = await response.json();
        setShareUrl(data.url);
        setShowShareModal(true);
      }
    } catch (error) {
      console.error('Share error:', error);
    } finally {
      setIsSharing(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
  };

  const getWhatsAppUrl = () => {
    return `https://wa.me/?text=${encodeURIComponent(`Check out this fact-check: ${shareUrl}`)}`;
  };

  const getTwitterUrl = () => {
    return `https://twitter.com/intent/tweet?text=${encodeURIComponent(`Fact-checked with FakeLens`)}&url=${encodeURIComponent(shareUrl)}`;
  };

  const getFacebookUrl = () => {
    return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`;
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedImage(file);
    }
  };

  const handleImageUpload = async () => {
    if (!selectedImage || !onImageUpload) return;

    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', selectedImage);

      const response = await fetch('/api/upload-image', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        // Pass both data and the file to parent
        onImageUpload(data, selectedImage);
        setSelectedImage(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload image');
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to upload image');
    } finally {
      setUploadingImage(false);
    }
  };

  const removeSelectedImage = () => {
    setSelectedImage(null);
  };

  const handleDocumentSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedDocument(file);
    }
  };

  const handleDocumentUpload = async () => {
    if (!selectedDocument || !onDocumentUpload) return;

    setUploadingDocument(true);
    try {
      const formData = new FormData();
      formData.append('document', selectedDocument);

      const response = await fetch('/api/upload-document', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onDocumentUpload(data, selectedDocument);
        setSelectedDocument(null);
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to upload document');
      }
    } catch (error) {
      console.error('Document upload error:', error);
      alert('Failed to upload document');
    } finally {
      setUploadingDocument(false);
    }
  };

  const removeSelectedDocument = () => {
    setSelectedDocument(null);
  };

  return (
    <>
      <div className="border-t border-[var(--border-color)] bg-[var(--bg-primary)]">
        <div className="max-w-3xl mx-auto px-4 py-4">
          {/* Document Preview */}
          {selectedDocument && (
            <div className="mb-3 p-3 bg-purple-50 border border-purple-200 rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-purple-900 truncate">{selectedDocument.name}</span>
                  <span className="text-xs text-purple-600">({(selectedDocument.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedDocument}
                  className="p-1 hover:bg-purple-100 rounded-lg text-purple-600"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={handleDocumentUpload}
                disabled={uploadingDocument}
                className="mt-2 w-full py-2 px-4 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingDocument ? 'Analyzing Document...' : 'Analyze Document'}
              </button>
            </div>
          )}

          {/* Image Preview */}
          {selectedImage && (
            <div className="mb-3 p-3 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl">
              <div className="flex items-center gap-3">
                <div className="flex-1 flex items-center gap-2">
                  <svg className="w-5 h-5 text-[var(--accent-green)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <span className="text-sm text-[var(--text-primary)] truncate">{selectedImage.name}</span>
                  <span className="text-xs text-[var(--text-secondary)]">({(selectedImage.size / 1024).toFixed(1)} KB)</span>
                </div>
                <button
                  type="button"
                  onClick={removeSelectedImage}
                  className="p-1 hover:bg-[var(--bg-tertiary)] rounded-lg text-[var(--text-secondary)]"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <button
                type="button"
                onClick={handleImageUpload}
                disabled={uploadingImage}
                className="mt-2 w-full py-2 px-4 bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white rounded-lg text-sm font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {uploadingImage ? 'Analyzing Image...' : 'Analyze Image'}
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex items-end gap-2">
            <div className="flex-1">
              <div className="relative">
                <textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSubmit(e);
                    }
                  }}
                  placeholder="Paste a news article, URL, or claim to verify..."
                  disabled={disabled}
                  className="w-full px-4 py-3 pr-12 bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
                  rows={1}
                  style={{ minHeight: '52px', maxHeight: '200px' }}
                />
              </div>
              {input && (
                <div className={`mt-1 text-xs px-2 ${
                  isValidLength 
                    ? 'text-[var(--text-secondary)]' 
                    : 'text-red-500 font-medium'
                }`}>
                  {isValidLength 
                    ? `${characterCount} characters`
                    : `Minimum ${MIN_CHARACTERS} characters required (${characterCount}/${MIN_CHARACTERS})`
                  }
                </div>
              )}
            </div>

            <label
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                disabled || uploadingImage
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'
                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}
              title="Upload image"
            >
              <input
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleImageSelect}
                disabled={disabled || uploadingImage}
                className="hidden"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M4 16L8.586 11.414C9.367 10.633 10.633 10.633 11.414 11.414L16 16M14 14L15.586 12.414C16.367 11.633 17.633 11.633 18.414 12.414L20 14M14 8H14.01M6 20H18C19.105 20 20 19.105 20 18V6C20 4.895 19.105 4 18 4H6C4.895 4 4 4.895 4 6V18C4 19.105 4.895 20 6 20Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </label>

            <label
              className={`p-3 rounded-xl transition-colors cursor-pointer ${
                disabled || uploadingDocument
                  ? 'bg-[var(--bg-secondary)] text-[var(--text-secondary)] cursor-not-allowed opacity-50'
                  : 'bg-[var(--bg-secondary)] hover:bg-[var(--bg-tertiary)] text-[var(--text-primary)]'
              }`}
              title="Upload document (PDF, DOCX, TXT)"
            >
              <input
                type="file"
                accept=".pdf,.docx,.txt,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
                onChange={handleDocumentSelect}
                disabled={disabled || uploadingDocument}
                className="hidden"
              />
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9 12H15M9 16H15M17 21H7C5.89543 21 5 20.1046 5 19V5C5 3.89543 5.89543 3 7 3H12.5858C12.851 3 13.1054 3.10536 13.2929 3.29289L18.7071 8.70711C18.8946 8.89464 19 9.149 19 9.41421V19C19 20.1046 18.1046 21 17 21Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </label>

            <button
              type="submit"
              disabled={disabled || !isValidLength}
              className={`p-3 rounded-xl transition-colors ${
                !disabled && isValidLength
                  ? 'bg-[var(--accent-green)] hover:bg-[var(--accent-green)]/90 text-white'
                  : 'bg-[var(--bg-tertiary)] text-[var(--text-secondary)] cursor-not-allowed'
              }`}
              title={!isValidLength ? `Minimum ${MIN_CHARACTERS} characters required` : 'Send message'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M22 2L11 13M22 2L15 22L11 13M22 2L2 9L11 13" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </form>
        </div>
      </div>

      {/* Personal Info Warning Modal */}
      {showPersonalInfoWarning && detectedInfo && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-100 flex items-center justify-center">
                <span className="text-xl">⚠️</span>
              </div>
              <h3 className="text-xl font-bold text-gray-900">Personal Information Detected</h3>
            </div>

            <div className="mb-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <p className="text-sm text-gray-700 mb-3">I detected you mentioned:</p>
              <ul className="space-y-2">
                {detectedInfo.map((info, idx) => (
                  <li key={idx} className="text-sm text-gray-700">
                    <span className="font-medium">{info.type.charAt(0).toUpperCase() + info.type.slice(1)}:</span> {info.value}
                  </li>
                ))}
              </ul>
            </div>

            <p className="text-sm text-gray-600 mb-6">
              Would you like me to fact-check any information related to this?
            </p>

            <div className="flex gap-3">
              <button
                onClick={handleCancelMessage}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition font-medium text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleContinueWithInfo}
                className="flex-1 px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition font-medium text-sm"
              >
                Continue & Fact-Check
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Modal */}
      {showShareModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6">
            <h3 className="text-xl font-bold text-gray-900 mb-4">Share Analysis</h3>
            
            <div className="mb-6">
              <div className="flex items-center gap-2 p-3 bg-gray-100 rounded-lg">
                <input
                  type="text"
                  value={shareUrl}
                  readOnly
                  className="flex-1 bg-transparent text-sm text-gray-700 outline-none"
                />
                <button
                  onClick={copyToClipboard}
                  className="px-3 py-1 bg-[var(--accent-green)] text-white text-sm rounded-lg hover:bg-[var(--accent-green)]/90"
                >
                  Copy
                </button>
              </div>
            </div>

            <div className="mb-6">
              <p className="text-sm text-gray-600 mb-3">Share via:</p>
              <div className="flex gap-3">
                <a
                  href={getWhatsAppUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 bg-green-500 text-white rounded-lg hover:bg-green-600 text-center text-sm font-medium"
                >
                  WhatsApp
                </a>
                <a
                  href={getTwitterUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 bg-black text-white rounded-lg hover:bg-gray-800 text-center text-sm font-medium"
                >
                  X
                </a>
                <a
                  href={getFacebookUrl()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-center text-sm font-medium"
                >
                  Facebook
                </a>
              </div>
            </div>

            <button
              onClick={() => setShowShareModal(false)}
              className="w-full py-2 px-4 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  );
}
