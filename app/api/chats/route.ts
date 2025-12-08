import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Get all chats for user
    const chats = await prisma.chat.findMany({
      where: { userId: session.user.id },
      include: { messages: true },
      orderBy: { updatedAt: "desc" },
    });

    // Helper function to safely parse JSON
    const safeJsonParse = (data: any) => {
      if (!data) return undefined;
      if (typeof data === 'object') return data;
      try {
        return JSON.parse(data);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        return undefined;
      }
    };

    // Transform messages to parse factCheck JSON and reconstruct imageAnalysis
    const transformedChats = chats.map(chat => {
      const transformedMessages = chat.messages.map(msg => {
        // Parse stored values safely
        const parsedFactCheck = safeJsonParse(msg.factCheck);
        const parsedAIDetection = safeJsonParse(msg.aiDetection);
        const parsedOCR = safeJsonParse(msg.ocrText);
        const parsedContentAnalysis = safeJsonParse(msg.contentAnalysis);
        const parsedImageMetadata = safeJsonParse(msg.imageMetadata);

        // Build imageAnalysis if we have image-related data
        // Check for aiDetection OR imageUrl to handle both new and old messages
        const hasImageData = parsedAIDetection || msg.imageUrl;
        const imageAnalysis = hasImageData
          ? {
              ocr: parsedOCR || { text: '', confidence: 0, language: 'unknown', hasText: false },
              aiDetection: parsedAIDetection || {
                isAIGenerated: false,
                confidence: 0,
                likelihood: 0,
                reasons: ['No AI detection data available'],
                warnings: [],
                metadata: { hasEXIF: false }
              },
              content: parsedContentAnalysis || { 
                safeSearch: { adult: 'unknown', violence: 'unknown', medical: 'unknown' }, 
                labels: [], 
                logos: [] 
              },
            }
          : undefined;

        return {
          role: msg.role,
          content: msg.content,
          analysis: parsedFactCheck,
          imageAnalysis,
          imagePreview: parsedImageMetadata,
        };
      });

      return {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.getTime(),
        updatedAt: chat.updatedAt.getTime(),
        isShared: chat.isShared,
        shareToken: chat.shareToken,
        messages: transformedMessages,
      };
    });

    return NextResponse.json({ chats: transformedChats });
  } catch (error: any) {
    console.error("Error fetching chats:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { title } = await req.json();

    const chat = await prisma.chat.create({
      data: {
        userId: session.user.id,
        title: title || "New Chat",
      },
    });

    // Return chat with empty messages array and converted timestamps
    return NextResponse.json({ 
      chat: {
        id: chat.id,
        title: chat.title,
        createdAt: chat.createdAt.getTime(),
        updatedAt: chat.updatedAt.getTime(),
        isShared: chat.isShared,
        shareToken: chat.shareToken,
        messages: [],
      }
    });
  } catch (error: any) {
    console.error("Error creating chat:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
