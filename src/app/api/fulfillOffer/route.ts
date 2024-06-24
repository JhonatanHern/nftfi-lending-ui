import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

// complete offer with fulfiller address, signature and transaction Id
export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const signature = query.get("signature");
  const fulfillerAddress = query.get("fulfillerAddress");
  const lenderNonce = query.get("lenderNonce");
  const offerId = query.get("offerId");
  if (!fulfillerAddress) {
    return NextResponse.json({
      status: 400,
      body: { error: "Fulfiller address is required" },
    });
  }
  if (!offerId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Offer Id is required" },
    });
  }
  if (!lenderNonce) {
    return NextResponse.json({
      status: 400,
      body: { error: "Lender nonce is required" },
    });
  }
  // TODO: validate signature properly
  if (!signature) {
    return NextResponse.json({
      status: 400,
      body: { error: "Signature is required" },
    });
  }
  const offer = await prisma.offer.update({
    where: { id: offerId },
    data: {
      fullfillerAddress: fulfillerAddress,
      fulfillerSignature: signature,
      lenderNonce: BigInt(lenderNonce),
    },
  });
  return NextResponse.json({
    ok: true,
  });
}
