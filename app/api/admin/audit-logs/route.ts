import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// This route uses Prisma (Node APIs). Ensure it runs in the Node runtime,
// not the Edge runtime which doesn't support Node native modules.
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const { action, userId, details } = await req.json();

    const log = await prisma.auditLog.create({
      data: {
        action,
        userId,
        details,
      },
    });

    return NextResponse.json({ log });
  } catch (error: any) {
    console.error("Error creating audit log:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
