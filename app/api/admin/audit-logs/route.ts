import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
