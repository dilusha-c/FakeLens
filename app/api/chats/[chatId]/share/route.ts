import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

export async function POST(req: NextRequest, props: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await props.params;
    const { isShared } = await req.json();

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    // Generate share token if enabling share
    const shareToken = isShared ? crypto.randomBytes(16).toString("hex") : null;

    const updatedChat = await prisma.chat.update({
      where: { id: chatId },
      data: {
        isShared,
        shareToken,
      },
    });

    // Log audit
    await prisma.auditLog.create({
      data: {
        action: isShared ? "share_chat" : "unshare_chat",
        userId: session.user.id,
        details: { chatId },
      },
    });

    return NextResponse.json({ 
      chat: updatedChat,
      shareUrl: isShared ? `${process.env.NEXT_PUBLIC_BASE_URL}/share/${shareToken}` : null 
    });
  } catch (error: any) {
    console.error("Error sharing chat:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
