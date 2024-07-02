import { PrismaClient } from "@prisma/client";
import { ethers } from "ethers";
import { NextResponse } from "next/server";
import NFTfiABI from "../../../utils/abis/NFTfi.json";
import { getProviderByNetwork } from "@/utils/provider";
import { whitelistedContracts } from "@/utils/whitelistedContracts";

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
  if (!transactionHash) {
    return NextResponse.json({
      status: 400,
      body: { error: "transactionHash is required" },
    });
  }
  const offer = await prisma.offer.findUnique({ where: { id: offerId } });
  if (!offer) {
    return NextResponse.json({ error: "No offer found" }, { status: 400 });
  }
  // fetch transaction data for validation
  const provider = getProviderByNetwork(offer.network);
  const transactionData = await provider.getTransaction(transactionHash);
  const transactionReceipt =
    await provider.getTransactionReceipt(transactionHash);
  const contractInterface = new ethers.Interface(NFTfiABI);
  if (!transactionData) {
    return NextResponse.json(
      { error: "No transaction found" },
      { status: 400 }
    );
  }
  if (!transactionData.isMined()) {
    return NextResponse.json(
      { error: "Transaction not yet mined" },
      { status: 400 }
    );
  }
  if (transactionReceipt?.status !== 1) {
    return NextResponse.json(
      { error: "Transaction execution failed." },
      { status: 400 }
    );
  }
  if (
    transactionData.to?.toLowerCase() !==
    whitelistedContracts[Number(offer.network)].NFTfi.toLowerCase()
  ) {
    return NextResponse.json(
      { error: "Wrong target contract called" },
      { status: 400 }
    );
  }
  const parsedTransaction = contractInterface.parseTransaction({
    data: transactionData.data,
    value: transactionData.value,
  });
  if (!parsedTransaction) {
    return NextResponse.json(
      { error: "Transaction unparseable" },
      { status: 500 }
    );
  }
  const { args, name } = parsedTransaction;
  if (name !== "beginLoan") {
    return NextResponse.json(
      { error: "Transaction not yet mined" },
      { status: 400 }
    );
  }
  const loanParams = rawArgsToBeginLoanParams(args);

  if (loanParams.lenderSignature !== offer.requesterSignature) {
    return NextResponse.json(
      { error: "Lender signature mismatch" },
      { status: 400 }
    );
  }

  if (loanParams.borrowerSignature !== offer.fulfillerSignature) {
    return NextResponse.json(
      { error: "Borrower signature mismatch" },
      { status: 400 }
    );
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
