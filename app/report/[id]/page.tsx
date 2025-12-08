'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { StoredReport, Verdict } from '@/types';
import ResultCard from '@/components/ResultCard';

export default function ReportPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params.id as string;

  const [report, setReport] = useState<StoredReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchReport() {
      try {
        const response = await fetch(`/api/report?id=${reportId}`);
        
        if (!response.ok) {
          throw new Error('Report not found');
        }

        const data = await response.json();
        setReport(data);
      } catch (err) {
        setError('Report not found or has expired');
      } finally {
        setLoading(false);
      }
    }

    if (reportId) {
      fetchReport();
    }
  }, [reportId]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block w-8 h-8 border-4 border-[var(--accent-green)] border-t-transparent rounded-full animate-spin mb-4"></div>
          <p className="text-[var(--text-secondary)]">Loading report...</p>
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Report Not Found
          </h1>
          <p className="text-[var(--text-secondary)] mb-6">
            {error || 'This report does not exist or has been removed.'}
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green)]/90"
          >
            Analyze a Claim with FakeLens
          </button>
        </div>
      </div>
    );
  }

  const { analysis } = report;
  const verdictLabel = analysis.verdict === 'fake' 
    ? 'Likely Fake'
    : analysis.verdict === 'real'
    ? 'Likely Real'
    : 'Uncertain';

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-[var(--text-primary)]">FakeLens</h1>
            <span className="text-sm text-[var(--text-secondary)]">Fact-Check Report</span>
          </div>
          <button
            onClick={() => router.push('/')}
            className="px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green)]/90 text-sm"
          >
            New Analysis
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-[var(--text-primary)] mb-2">
            Claim Analysis: {verdictLabel}
          </h2>
          <p className="text-[var(--text-secondary)] text-sm">
            Generated on {new Date(report.createdAt).toLocaleDateString()} at{' '}
            {new Date(report.createdAt).toLocaleTimeString()}
          </p>
        </div>

        {/* Claim Text */}
        <div className="mb-6 p-6 bg-[var(--bg-secondary)] rounded-xl border border-[var(--border-color)]">
          <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-2">
            ANALYZED CLAIM
          </h3>
          <p className="text-[var(--text-primary)] leading-relaxed">
            {analysis.claimText}
          </p>
        </div>

        {/* Result Card */}
        <div className="mb-8">
          <ResultCard analysis={analysis} />
        </div>

        {/* Call to Action */}
        <div className="text-center p-8 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200">
          <h3 className="text-xl font-bold text-gray-900 mb-2">
            Want to verify another claim?
          </h3>
          <p className="text-gray-600 mb-4">
            Use FakeLens to fact-check news articles, social media posts, and claims.
          </p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-[var(--accent-green)] text-white rounded-lg hover:bg-[var(--accent-green)]/90 font-medium"
          >
            Analyze Another Claim with FakeLens
          </button>
        </div>

        {/* Footer Disclaimer */}
        <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="text-sm text-yellow-800">
            <strong>Disclaimer:</strong> This analysis is generated by an automated system and should be used as a guide only. 
            Always verify information with multiple trusted sources and use critical thinking when evaluating claims.
          </p>
        </div>
      </main>
    </div>
  );
}
