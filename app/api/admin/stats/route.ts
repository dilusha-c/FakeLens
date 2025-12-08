import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This should have admin verification in production
export async function GET(req: NextRequest) {
  try {
    const totalUsers = await prisma.user.count();
    const totalChats = await prisma.chat.count();
    const totalImages = await prisma.message.count({
      where: { imageUrl: { not: null } },
    });

    const totalApiCalls = await prisma.analytics.aggregate({
      _sum: { apiCalls: true },
    });

    return NextResponse.json({
      totalUsers,
      totalChats,
      totalImages,
      totalApiCalls: totalApiCalls._sum.apiCalls || 0,
    });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
