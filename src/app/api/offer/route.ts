import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";

const prisma = new PrismaClient();

// create offer
export async function POST(request: Request) {
  console.log("obtained data");

  const query = new URLSearchParams(request.url.split("?")[1]);
  console.log("query");

  const loanPrincipalAmount = query.get("loanPrincipalAmount");
  const maximumRepaymentAmount = query.get("maximumRepaymentAmount");
  const nftCollateralId = query.get("nftCollateralId");
  const loanDuration = query.get("loanDuration");
  const loanInterestRateForDurationInBasisPoints = query.get(
    "loanInterestRateForDurationInBasisPoints"
  );
  const adminFeeInBasisPoints = query.get("adminFeeInBasisPoints");
  const borrowerNonce = query.get("borrowerNonce");
  const nftCollateralContract = query.get("nftCollateralContract");
  const loanERC20Denomination = query.get("loanERC20Denomination");
  const requesterSignature = query.get("requesterSignature");
  const requesterAddress = query.get("requesterAddress");
  const network = query.get("network");
  console.log("params", {
    loanPrincipalAmount,
    maximumRepaymentAmount,
    nftCollateralId,
    loanDuration,
    loanInterestRateForDurationInBasisPoints,
    adminFeeInBasisPoints,
    borrowerNonce,
    nftCollateralContract,
    loanERC20Denomination,
    requesterSignature,
    requesterAddress,
    network,
  });

  // Validation
  if (
    !loanPrincipalAmount ||
    !maximumRepaymentAmount ||
    !nftCollateralId ||
    !loanDuration ||
    !loanInterestRateForDurationInBasisPoints ||
    !adminFeeInBasisPoints ||
    !borrowerNonce ||
    !nftCollateralContract ||
    !loanERC20Denomination ||
    !requesterSignature ||
    !requesterAddress ||
    !network
  ) {
    return NextResponse.json(
      { error: "All fields are required" },
      { status: 400 }
    );
  }
  console.log("valid");

  const offer = await prisma.offer.create({
    data: {
      loanPrincipalAmount: BigInt(loanPrincipalAmount),
      maximumRepaymentAmount: BigInt(maximumRepaymentAmount),
      nftCollateralId,
      loanDuration: parseInt(loanDuration),
      loanInterestRateForDurationInBasisPoints: parseInt(
        loanInterestRateForDurationInBasisPoints
      ),
      adminFeeInBasisPoints: parseInt(adminFeeInBasisPoints),
      borrowerNonce: BigInt(borrowerNonce),
      nftCollateralContract,
      loanERC20Denomination,
      requesterSignature,
      requesterAddress,
      network,
    },
  });
  console.log("created: ", offer);

  return NextResponse.json({ success: true });
}
