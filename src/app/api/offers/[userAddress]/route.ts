import { PrismaClient } from "@prisma/client";
import { NextResponse } from "next/server";
const prisma = new PrismaClient();

type Params = {
  userAddress: string;
};

export async function GET(_request: Request, context: { params: Params }) {
  const { userAddress } = context.params;
  const offers = await prisma.offer.findMany({
    where:
      userAddress === "all"
        ? {
            fullfillerAddress: undefined,
          }
        : {
            OR: [
              { fullfillerAddress: userAddress },
              { requesterAddress: userAddress },
            ],
          },
    // include: {
    //   requester: true,
    //   fulfiller: true,
    // },
  });
  // @ts-ignore
  BigInt.prototype["toJSON"] = function () {
    // hack to avoid manually parsing each BigInt-ish property when using JSON stringify
    return this.toString();
  };
  return NextResponse.json({
    status: 200,
    body: offers,
  });
}
