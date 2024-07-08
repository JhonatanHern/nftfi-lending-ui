import { isValidLenderSignature } from "@/utils/validateSignatures";
import { verifyLoginSignature } from "@/utils/verifyLoginSignature";
import { Offer, PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

// complete offer with fulfiller address, signature and transaction Id
export async function POST(request: Request) {
  const query = new URLSearchParams(request.url.split("?")[1]);
  const signature = query.get("signature");
  const fulfillerAddress = query.get("fulfillerAddress");
  const lenderNonce = query.get("lenderNonce");
  const offerId = query.get("offerId");
  const loginSignature = query.get("loginSignature");
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
  if (!loginSignature) {
    return NextResponse.json({
      status: 400,
      body: { error: "Login Signature is required" },
    });
  }

  const offer: Offer | null = await prisma.offer.findUnique({
    where: { id: offerId },
  });

  if (!offer) {
    return NextResponse.json({
      status: 400,
      body: { error: "No offer found with this ID" },
    });
  }
  if (!verifyLoginSignature(loginSignature, fulfillerAddress)) {
    return NextResponse.json(
      { error: "Wrong login signature." },
      { status: 400 }
    );
  }
  if (!signature) {
    return NextResponse.json({
      status: 400,
      body: { error: "Missing signature" },
    });
  }
  if (
    !(await isValidLenderSignature(
      offer,
      signature,
      lenderNonce,
      fulfillerAddress,
      offer?.network
    ))
  ) {
    return NextResponse.json({
      status: 400,
      body: { error: "Signature is required" },
    });
  }
  await prisma.offer.update({
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
