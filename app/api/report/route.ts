import { NextRequest, NextResponse } from 'next/server';
import { ReportApiRequest, ReportApiResponse, StoredReport } from '@/types';

// In-memory storage for reports (in production, use a database)
const reports = new Map<string, StoredReport>();

export async function POST(request: NextRequest) {
  try {
    const body: ReportApiRequest = await request.json();
    const { analysis } = body;

    if (!analysis) {
      return NextResponse.json(
        { error: 'Analysis data required' },
        { status: 400 }
      );
    }

    // Generate unique ID
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2);

    // Store report
    const report: StoredReport = {
      id,
      analysis,
      createdAt: Date.now(),
    };

    reports.set(id, report);

    // Generate public URL
    const url = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/report/${id}`;

    const response: ReportApiResponse = {
      id,
      url,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Report API error:', error);
    return NextResponse.json(
      { error: 'Failed to create report' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Report ID required' },
        { status: 400 }
      );
    }

    const report = reports.get(id);

    if (!report) {
      return NextResponse.json(
        { error: 'Report not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(report);
  } catch (error) {
    console.error('Report GET error:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve report' },
      { status: 500 }
    );
  }
}
