import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

export async function GET(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const address = query.get("address");
  if (!address) {
    return NextResponse.json({
      status: 400,
      body: { error: "Address is required" },
    });
  }
  const user = await prisma.user.findUnique({
    where: { address },
  });
  if (!user) {
    return NextResponse.json({
      status: 404,
      body: { error: "User not found" },
    });
  }
  return NextResponse.json({
    status: 200,
    body: user,
  });
}

export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const signature = query.get("signature");
  const address = query.get("address");
  if (!address) {
    return NextResponse.json({
      status: 400,
      body: { error: "Address is required" },
    });
  }
  // TODO: validate signature properly
  if (!signature) {
    return NextResponse.json({
      status: 401,
      body: { error: "Unauthorized" },
    });
  }
  // store user
  const user = await prisma.user.upsert({
    where: { address },
    update: {},
    create: {
      address,
    },
  });
}
