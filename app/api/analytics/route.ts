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

    // Get user analytics
    const analytics = await prisma.analytics.findUnique({
      where: { userId: session.user.id },
    });

    if (!analytics) {
      return NextResponse.json(
        { error: "Analytics not found" },
        { status: 404 }
      );
    }

    // Get chat statistics
    const chatStats = await prisma.chat.groupBy({
      by: ["userId"],
      where: { userId: session.user.id },
      _count: true,
    });

    // Get image statistics
    const imageStats = await prisma.message.groupBy({
      by: ["chatId"],
      where: { 
        chat: { userId: session.user.id },
        imageUrl: { not: null }
      },
      _count: true,
    });

    return NextResponse.json({
      analytics,
      stats: {
        totalChats: chatStats[0]?._count || 0,
        totalImages: imageStats.length,
      },
    });
  } catch (error: any) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
