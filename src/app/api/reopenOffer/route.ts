import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

// complete offer with fulfiller address, signature and transaction Id
export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const offerId = query.get("offerId");
  if (!offerId) {
    return NextResponse.json({
      status: 400,
      body: { error: "Offer Id is required" },
    });
  }

  console.log({ offerId });

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
