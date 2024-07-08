import { verifyLoginSignature } from "@/utils/verifyLoginSignature";
import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

// complete offer with fulfiller address, signature and transaction Id
export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const offerId = query.get("offerId");
  const loginSignature = query.get("loginSignature");
  if (!offerId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Offer Id is required" },
    });
  }

  if (!loginSignature) {
    return NextResponse.json({
      status: 400,
      body: { error: "Login Signature is required" },
    });
  }
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    return NextResponse.json({ error: "No offer found" }, { status: 400 });
  }
  if (!verifyLoginSignature(loginSignature, offer.requesterAddress)) {
    return NextResponse.json(
      { error: "Wrong login signature." },
      { status: 400 }
    );
  }

  const update = await prisma.offer.update({
    where: { id: offerId },
    data: {
      fullfillerAddress: null,
      fulfillerSignature: null,
      lenderNonce: null,
    },
  });
  console.log({ update });

  return NextResponse.json({
    ok: true,
  });
}
