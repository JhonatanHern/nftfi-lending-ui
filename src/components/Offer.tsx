import { useAccount } from "wagmi";
import { useState, useEffect, useMemo } from "react";
import { getAccount, signMessage } from "@wagmi/core";
import { config } from "@/wagmi";
import {
  readContract as directRead,
  writeContract,
  getPublicClient,
} from "@wagmi/core";
import { useReadContract } from "wagmi";
import { toast } from "react-toastify";
import Button from "./Button";
import {
  WhitelistedContract,
  whitelistedContracts,
} from "@/utils/whitelistedContracts";
import DataPackerABI from "../utils/abis/DataPacker.json";
import NFTfiABI from "../utils/abis/NFTfi.json";
import ERC20ABI from "../utils/abis/ERC20.json";
import ERC721ABI from "../utils/abis/ERC721.json";
import { ethers } from "ethers";

type OfferParams = {
  offer: any;
  fetchOrders: () => void;
};

function Offer({ offer, fetchOrders }: OfferParams) {
  const account = useAccount();
  const client = getPublicClient(config);
  const lenderNonce = useMemo(
    () => BigInt(Math.floor(Math.random() * 10000000)), // random huge value
    []
  );
  const { chainId: currentChainId } = getAccount(config);
  const requestedERC20 = useMemo(() => {
    return whitelistedContracts[offer.network as number].erc20tokens.find(
      (token: WhitelistedContract) =>
        token.address.toLowerCase() ===
        offer.loanERC20Denomination.toLowerCase()
    );
  }, [offer]);
  const collateralContract = useMemo(() => {
    return whitelistedContracts[offer.network as number].erc721tokens.find(
      (token: WhitelistedContract) =>
        token.address.toLowerCase() ===
        offer.nftCollateralContract.toLowerCase()
    );
  }, [offer]);
  const { data: allowance } = useReadContract({
    abi: ERC20ABI,
    address: requestedERC20?.address,
    functionName: "allowance",
    args: [
      offer.fullfillerAddress,
      whitelistedContracts[offer.network as number].NFTfi,
    ],
  });
  const insufficientAllowance: boolean = useMemo(() => {
    return (
      typeof allowance === "bigint" &&
      allowance < BigInt(offer.loanPrincipalAmount)
    );
  }, [allowance, offer]);
  const { data: fulfillerBalance } = useReadContract({
    abi: ERC20ABI,
    address: requestedERC20?.address,
    functionName: "balanceOf",
    args: [offer.fullfillerAddress],
  });
  const insufficientFulfillerBalance: boolean = useMemo(() => {
    return (
      typeof fulfillerBalance === "bigint" &&
      fulfillerBalance < BigInt(offer.loanPrincipalAmount)
    );
  }, [fulfillerBalance, offer]);
  const approveFundsTransfer = async () => {
    // approval before the fulfilling step and for after in case that it gets revoked
    if (!requestedERC20) {
      return;
    }
    const approvedAmount: any = await directRead(config, {
      abi: ERC20ABI,
      address: requestedERC20.address,
      functionName: "allowance",
      args: [account.address, whitelistedContracts[currentChainId || 1].NFTfi],
    });

    if (approvedAmount >= BigInt(offer.loanPrincipalAmount)) {
      return;
    }
    try {
      const txHash = await writeContract(config, {
        abi: ERC20ABI,
        address: requestedERC20.address,
        functionName: "approve",
        args: [
          whitelistedContracts[currentChainId || 1].NFTfi,
          offer.loanPrincipalAmount,
        ],
      });
      const txReceipt = await client.waitForTransactionReceipt({
        hash: txHash,
      });

      toast.success("NFT Approved");
    } catch (error) {
      toast.error("Error approving NFT");
      console.log(error);
    }
  };
  const fulfillOrder = async () => {
    if (!currentChainId) {
      console.log("No chain");

      return;
    }
    const packedData: any = await directRead(config, {
      abi: DataPackerABI,
      address: `0x${whitelistedContracts[currentChainId].DataPacker.split("0x").join("")}`,
      functionName: "packLenderData",
      args: [
        offer.loanPrincipalAmount, // uint256 _loanPrincipalAmount,
        offer.maximumRepaymentAmount, // uint256 _maximumRepaymentAmount,
        offer.nftCollateralId, // uint256 _nftCollateralId,
        offer.loanDuration, // uint256 _loanDuration,
        offer.loanInterestRateForDurationInBasisPoints, // uint256 _loanInterestRateForDurationInBasisPoints,
        offer.adminFeeInBasisPoints, // uint256 _adminFeeInBasisPoints,
        lenderNonce, // uint256 _lenderNonce,
        offer.nftCollateralContract, // address _nftCollateralContract,
        offer.loanERC20Denomination, // address _loanERC20Denomination,
        account.address, // address _lender,
        offer.loanInterestRateForDurationInBasisPoints != 4294967295, // bool _interestIsProRated
      ],
    });
    const wagmiSignedMessage = await signMessage(config, {
      message: { raw: packedData[0] },
    });

    // verify signature
    const contractSignatureVerification: any = await directRead(config, {
      abi: NFTfiABI,
      address: `0x${whitelistedContracts[currentChainId].NFTfi.split("0x").join("")}`,
      functionName: "isValidLenderSignature",
      args: [
        offer.loanPrincipalAmount, // uint256 _loanPrincipalAmount,
        offer.maximumRepaymentAmount, // uint256 _maximumRepaymentAmount,
        offer.nftCollateralId, // uint256 _nftCollateralId,
        offer.loanDuration, // uint256 _loanDuration,
        offer.loanInterestRateForDurationInBasisPoints, // uint256 _loanInterestRateForDurationInBasisPoints,
        offer.adminFeeInBasisPoints, // uint256 _adminFeeInBasisPoints,
        lenderNonce, // uint256 _lenderNonce,
        offer.nftCollateralContract, // address _nftCollateralContract,
        offer.loanERC20Denomination, // address _loanERC20Denomination,
        account.address, // address _lender,
        offer.loanInterestRateForDurationInBasisPoints != 4294967295, // bool _interestIsProRated
        wagmiSignedMessage,
      ],
    });
    if (!contractSignatureVerification) {
      toast.error("Signature verification error.");
      return;
    }
    await approveFundsTransfer();
    // call endpoint to fulfill order:
    const data = {
      signature: wagmiSignedMessage,
      fulfillerAddress: account.address,
      lenderNonce,
      offerId: offer.id,
    };
    const keyValuePairs = [];
    for (const key of Object.keys(data)) {
      keyValuePairs.push(
        // @ts-ignore
        `${key}=${encodeURIComponent((data[key] || "").toString())}`
      );
    }
    const query = keyValuePairs.join("&");
    try {
      const request = await fetch("/api/fulfillOffer?" + query, {
        method: "POST",
      });
      const response = await request.json();
      if (response.ok) {
        toast.success("Order fulfilled");
        fetchOrders();
      } else {
        toast.error("An error has ocurred while fullfilling this order");
      }
    } catch (e) {
      console.log(e);
      toast.error("An error has ocurred while fullfilling this order");
    }
  };
  const executeFulfilledOrder = async () => {
    if (!currentChainId || !collateralContract) {
      return;
    }
    // check if current user still owns the NFT

    const owner: any = await directRead(config, {
      abi: ERC721ABI,
      address: collateralContract.address,
      functionName: "ownerOf",
      args: [offer.nftCollateralId],
    });

    if (owner.toLowerCase() !== account.address?.toLowerCase()) {
      if (
        owner.toLowerCase() ===
        whitelistedContracts[currentChainId].NFTfi.toLowerCase()
      ) {
        toast.error(
          "Your NFT is already being used as collateral in a different order."
        );
      } else {
        toast.error(
          "You no longer hold the collateral NFT. This order cannot be executed"
        );
      }
      return;
    }

    try {
      const transactionHash = await writeContract(config, {
        abi: NFTfiABI,
        address: `0x${whitelistedContracts[currentChainId].NFTfi.split("0x").join("")}`,
        functionName: "beginLoan",
        args: [
          offer.loanPrincipalAmount, // uint256 _loanPrincipalAmount,
          offer.maximumRepaymentAmount, // uint256 _maximumRepaymentAmount,
          offer.nftCollateralId, // uint256 _nftCollateralId,
          offer.loanDuration, // uint256 _loanDuration,
          offer.loanInterestRateForDurationInBasisPoints, // uint256 _loanInterestRateForDurationInBasisPoints,
          offer.adminFeeInBasisPoints, // uint256 _adminFeeInBasisPoints,
          [offer.borrowerNonce, offer.lenderNonce], // uint256[2] memory _borrowerAndLenderNonces,
          offer.nftCollateralContract, // address _nftCollateralContract,
          offer.loanERC20Denomination, // address _loanERC20Denomination,
          offer.fullfillerAddress, // address _lender,
          offer.requesterSignature, // bytes memory _borrowerSignature,
          offer.fulfillerSignature, // bytes memory _lenderSignature
        ],
      });
      await client.waitForTransactionReceipt({
        hash: transactionHash,
      });
      const request = await fetch(
        "/api/notifyTransactionExecution?transactionHash=" +
          encodeURIComponent(transactionHash) +
          "&offerId=" +
          encodeURIComponent(offer.id),
        {
          method: "POST",
        }
      );
      const response = await request.json();
      if (response.ok) {
        toast.success(
          "Order executed. Check your wallet for the requested " +
            requestedERC20?.symbol
        );
        fetchOrders();
      } else {
        toast.error("An error has ocurred while storing this order");
      }
    } catch (e) {
      console.log(e);
      if (e instanceof Error) {
        // extract specific error from generic multiline error string from contract
        if (
          e.message.includes(
            'The contract function "beginLoan" reverted with the following reason:'
          )
        ) {
          toast.error(
            e.message
              .split("reverted with the following reason:")[1]
              .split("Contract Call:")[0]
          );
        } else {
          toast.error("An unknown error has happened");
        }
      }
    }
  };
  const resetOrder = async () => {
    try {
      const request = await fetch(
        "/api/reopenOffer?offerId=" + encodeURIComponent(offer.id),
        {
          method: "POST",
        }
      );
      const response = await request.json();
      console.log({ response });
      fetchOrders();
    } catch (e) {
      toast.error("Offer reopening error");
    }
  };

  return (
    <div
      key={offer.id}
      className="flex p-3 bg-white mb-3 overflow-x-auto justify-between align-center"
    >
      <div>
        <p>
          #{offer.nftCollateralId} from {collateralContract?.name} (
          {collateralContract?.symbol})
        </p>
        <p>
          requesting{" "}
          {ethers?.formatUnits(
            offer.loanPrincipalAmount,
            requestedERC20?.decimals
          )}{" "}
          {requestedERC20?.symbol}
        </p>
        <p className="inline-block text-xs p-1 bg-gray rounded">
          Created by {offer.requesterAddress}
        </p>
        {offer.fullfillerAddress && (
          <p className="inline-block text-xs p-1 bg-gray rounded">
            Fulfilled by {offer.fullfillerAddress}
          </p>
        )}
        <p className="inline-block text-xs p-1 bg-gray rounded">
          Network: {whitelistedContracts[offer.network as number].chainName}
        </p>
      </div>
      {!offer.executionTransaction && (
        <div className="max-w-60">
          {offer.fullfillerAddress &&
            offer.requesterAddress?.toLowerCase() !==
              account.address?.toLowerCase() && <span>Offer fulfilled</span>}
          {offer.fullfillerAddress && // order has been fulfilled
            typeof fulfillerBalance === "bigint" && // fulfiller balance has been loaded
            offer.requesterAddress?.toLowerCase() ===
              account.address?.toLowerCase() && ( // user is borrower
              <>
                <Button
                  onClick={executeFulfilledOrder}
                  disabled={
                    insufficientAllowance || insufficientFulfillerBalance
                  }
                >
                  Execute order
                </Button>
                {insufficientAllowance && (
                  <span className="text-xs">
                    This allowance has been revoked. The order can't be
                    executed.{" "}
                    <a
                      href="#"
                      className="underline"
                      onClick={(e) => {
                        e.preventDefault();
                        resetOrder();
                      }}
                    >
                      Click here to reopen the order
                    </a>
                  </span>
                )}
                {!insufficientAllowance && insufficientFulfillerBalance && (
                  <span className="text-xs">
                    The lender lacks the balance to fulfill this order.{" "}
                    <a
                      href="#"
                      className="underline"
                      onClick={(e) => {
                        e.preventDefault();
                        resetOrder();
                      }}
                    >
                      Click here to reopen the order
                    </a>
                  </span>
                )}
              </>
            )}
          {!offer.fullfillerAddress &&
            offer.requesterAddress?.toLowerCase() !==
              account.address?.toLowerCase() && (
              <div>
                {offer.network === currentChainId?.toString() ? (
                  <Button onClick={fulfillOrder}>Fulfill Order</Button>
                ) : (
                  <>
                    <Button disabled>Fulfill Order</Button>
                    <span className="inline-block text-xs p-1 bg-gray rounded">
                      switch to{" "}
                      {whitelistedContracts[offer.network as number].chainName}{" "}
                      to fulfill this offer.
                    </span>
                  </>
                )}
              </div>
            )}
          {!offer.fullfillerAddress &&
            offer.requesterAddress?.toLowerCase() ===
              account.address?.toLowerCase() && (
              <div>
                <Button disabled>Waiting for order to be fulfilled</Button>
              </div>
            )}
        </div>
      )}
      {offer.executionTransaction && (
        <div className="max-w-60">Order Active</div>
      )}
    </div>
  );
}

export default Offer;
