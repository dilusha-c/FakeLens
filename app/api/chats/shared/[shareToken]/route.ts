import { prisma } from '@/lib/prisma';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  req: NextRequest,
  { params }: { params: { shareToken: string } }
) {
  try {
    const { shareToken } = params;

    // Find the shared chat
    const chat = await prisma.chat.findFirst({
      where: {
        shareToken: shareToken,
        isShared: true,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
          select: {
            id: true,
            role: true,
            content: true,
            imageUrl: true,
            imageMetadata: true,
            ocrText: true,
            aiDetection: true,
            factCheck: true,
            contentAnalysis: true,
            createdAt: true,
          },
        },
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: 'Shared chat not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({ chat });
  } catch (error: any) {
    console.error('Error fetching shared chat:', error);
    return NextResponse.json(
      { error: 'Failed to fetch shared chat' },
      { status: 500 }
    );
  }
}
