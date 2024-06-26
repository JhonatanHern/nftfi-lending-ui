import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

// complete offer with fulfiller address, signature and transaction Id
export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const transactionHash = query.get("transactionHash");
  const offerIdInContract = query.get("offerIdInContract");
  const offerId = query.get("offerId");
  if (!offerId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Offer Id is required" },
    });
  }
  // TODO: validate transaction properly
  if (!transactionHash) {
    return NextResponse.json({
      status: 400,
      body: { error: "transactionHash is required" },
    });
  }
  if (!offerIdInContract) {
    return NextResponse.json({
      status: 400,
      body: { error: "offerIdInContract is required" },
    });
  }
  await prisma.offer.update({
    where: { id: offerId },
    data: {
      executionTransaction: transactionHash,
      offerIdInContract: offerIdInContract,
    },
  });
  return NextResponse.json({
    ok: true,
  });
}
