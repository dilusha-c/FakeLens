import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    const { role, content, imageUrl, imageMetadata, ocrText, aiDetection, factCheck, contentAnalysis } = await req.json();

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

    // Create message
    const message = await prisma.message.create({
      data: {
        chatId,
        role,
        content,
        imageUrl,
        imageMetadata,
        ocrText,
        aiDetection,
        factCheck,
        contentAnalysis,
      },
    });

    // Update chat timestamp
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() },
    });

    // Update analytics
    if (role === "user") {
      await prisma.analytics.updateMany({
        where: { userId: session.user.id },
        data: { totalMessages: { increment: 1 } },
      });
    }

    return NextResponse.json({ message });
  } catch (error: any) {
    console.error("Error creating message:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest, props: { params: Promise<{ chatId: string }> }) {
  try {
    const session = await auth();
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { chatId } = await props.params;

    // Verify chat ownership
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        userId: session.user.id,
      },
      include: { messages: true },
    });

    if (!chat) {
      return NextResponse.json(
        { error: "Chat not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ messages: chat.messages });
  } catch (error: any) {
    console.error("Error fetching messages:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
