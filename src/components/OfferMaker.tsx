import { useEffect, useMemo, useState } from "react";
import { useAccount } from "wagmi";
import {
  getAccount,
  signMessage,
  waitForTransactionReceipt,
} from "@wagmi/core";
import Button from "./Button";
import { config } from "@/wagmi";
import { ethers } from "ethers";
import {
  readContract as directRead,
  getPublicClient,
  writeContract,
} from "@wagmi/core";
import { formatDistance, max } from "date-fns";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import ERC721ABI from "../utils/abis/ERC721.json";
import NFTfiABI from "../utils/abis/NFTfi.json";
import DataPackerABI from "../utils/abis/DataPacker.json";

import { whitelistedContracts } from "@/utils/whitelistedContracts";

enum Steps {
  NFT_APPROVAL,
  LOADING,
  SIGNATURE,
  END,
}

type OfferMakerParams = {
  fetchOrders: () => void;
};

const OfferMaker = ({ fetchOrders }: OfferMakerParams) => {
  const { chainId: network } = getAccount(config);
  const client = getPublicClient(config);
  const account = useAccount();
  const [step, setStep] = useState<Steps>(Steps.NFT_APPROVAL);
  const [nonceStarter, setNonceStarter] = useState<number>(0);

  // State variables for each parameter
  const [loanPrincipalAmount, setLoanPrincipalAmount] = useState<BigInt | null>(
    null
  );
  const [maximumRepaymentAmount, setMaximumRepaymentAmount] =
    useState<BigInt | null>(null);
  const [nftCollateralId, setNftCollateralId] = useState<BigInt | null>(null);
  const [loanDuration, setLoanDuration] = useState<BigInt | null>(null);
  const [
    loanInterestRateForDurationInBasisPoints,
    setLoanInterestRateForDurationInBasisPoints,
  ] = useState<BigInt | null>(null);
  const [nftCollateralContract, setNftCollateralContract] = useState<
    string | null
  >(null);
  const [loanERC20Denomination, setLoanERC20Denomination] = useState<
    string | null
  >(null);
  const requesterAddress = account?.address;
  const borrowerNonce = useMemo(
    () => BigInt(Math.floor(Math.random() * 10000000)), // random huge value
    [nonceStarter]
  );
  const validateForm = () => {
    let errors = [];

    if (!loanPrincipalAmount) {
      errors.push("Loan Principal Amount is required");
    }

    if (!maximumRepaymentAmount) {
      errors.push("Maximum Repayment Amount is required");
    }

    if (
      loanPrincipalAmount &&
      maximumRepaymentAmount &&
      maximumRepaymentAmount < loanPrincipalAmount
    ) {
      errors.push("Negative interest rate loans are not allowed.");
    }

    if (!nftCollateralId) {
      errors.push("NFT Collateral ID is required");
    }

    if (!loanDuration) {
      errors.push("Loan Duration is required");
    }

    if (loanDuration && Number(loanDuration) > 32054400) {
      errors.push("Loan duration exceeds maximum loan duration (53 weeks)");
    }

    if (!loanInterestRateForDurationInBasisPoints) {
      errors.push(
        "Loan Interest Rate for Duration in Basis Points is required"
      );
    }

    if (!nftCollateralContract) {
      errors.push("NFT Collateral Contract is required");
    }

    if (!loanERC20Denomination) {
      errors.push("Loan ERC20 Denomination is required");
    }

    return errors;
  };

  useEffect(() => {
    // set first values for loanERC20Denomination and nftCollateralContract
    if (network) {
      setLoanERC20Denomination(
        whitelistedContracts[network]?.erc20tokens[0]?.address
      );
      setNftCollateralContract(
        whitelistedContracts[network]?.erc721tokens[0]?.address
      );
    }
  }, [network]);

  const executeApproval = async () => {
    const errors = validateForm();
    if (errors.length > 0) {
      // Display errors to the user
      errors.forEach((error) => toast.error(error));
      return;
    }
    if (!nftCollateralContract || !nftCollateralId) {
      return;
    }
    // check if approval is needed
    const approvedAccount: any = await directRead(config, {
      abi: ERC721ABI,
      address: `0x${nftCollateralContract.split("0x").join("")}`,
      functionName: "getApproved",
      args: [nftCollateralId],
    });
    console.log("Approved Account: ", approvedAccount);

    if (
      (approvedAccount + "").toLowerCase() ===
      whitelistedContracts[network || 1].NFTfi.toLowerCase()
    ) {
      toast.info("NFT already approved");
      setStep(Steps.SIGNATURE);
      return;
    }
    setStep(Steps.LOADING);
    try {
      const txHash = await writeContract(config, {
        abi: ERC721ABI,
        address: `0x${nftCollateralContract.split("0x").join("")}`,
        functionName: "approve",
        args: [whitelistedContracts[network || 1].NFTfi, nftCollateralId],
      });
      const txReceipt = await client.waitForTransactionReceipt({
        hash: txHash,
      });

      setStep(Steps.SIGNATURE);
      toast.success("NFT Approved");
    } catch (error) {
      setStep(Steps.NFT_APPROVAL);
      toast.error("Error approving NFT");
      console.log(error);
    }
  };

  const executeSignature = async () => {
    if (!network) {
      return;
    }
    // get user signature
    const packedData: any = await directRead(config, {
      abi: DataPackerABI,
      address: `0x${whitelistedContracts[network].DataPacker.split("0x").join("")}`,
      functionName: "packBorrowerData",
      args: [
        nftCollateralId,
        borrowerNonce,
        nftCollateralContract,
        account.address, // borrower
      ],
    });

    const wagmiSignedMessage = await signMessage(config, {
      message: { raw: packedData[0] },
    });

    // verify signature
    const wagmiIsValidSignature: any = await directRead(config, {
      abi: NFTfiABI,
      address: `0x${whitelistedContracts[network].NFTfi.split("0x").join("")}`,
      functionName: "isValidBorrowerSignature",
      args: [
        nftCollateralId,
        borrowerNonce,
        nftCollateralContract,
        account.address, // borrower
        wagmiSignedMessage,
      ],
    });
    console.log("Valid? ", {
      wagmiIsValidSignature,
    });

    // send signed offer to backend
    const offer = {
      loanPrincipalAmount,
      maximumRepaymentAmount,
      nftCollateralId,
      loanDuration,
      loanInterestRateForDurationInBasisPoints,
      adminFeeInBasisPoints: 25,
      borrowerNonce,
      nftCollateralContract,
      loanERC20Denomination,
      requesterSignature: wagmiSignedMessage,
      requesterAddress,
      network,
    };
    // turn into query string
    const keyValuePairs = [];
    for (const key of Object.keys(offer)) {
      keyValuePairs.push(
        // @ts-ignore
        `${key}=${encodeURIComponent((offer[key] || "").toString())}`
      );
    }
    const query = keyValuePairs.join("&");
    const request = await fetch("/api/offer?" + query, {
      method: "POST",
    });
    const response = await request.json();
    console.log("response: ", response);
    fetchOrders(); // fetch updater order list
    setNonceStarter(nonceStarter + 1); // generate new nonce
    setStep(Steps.END);
  };
  const pickedToken = useMemo(() => {
    return whitelistedContracts[network || 0]?.erc20tokens.find(
      (t) => t.address === loanERC20Denomination
    );
  }, [loanERC20Denomination]);
  const parseAmountToDecimals = (amount: string) => {
    return BigInt(ethers.parseUnits(amount, pickedToken?.decimals));
  };
  return (
    <div>
      {step === Steps.NFT_APPROVAL && (
        <>
          <h1 className="text-lg mb-5">Make Offer</h1>
          <label>Loan Principal Amount</label>
          <input
            type="number"
            onChange={(e) =>
              setLoanPrincipalAmount(parseAmountToDecimals(e.target.value))
            }
            className="mb-1 p-1"
          />
          <label>Maximum Repayment Amount</label>
          <input
            type="number"
            onChange={(e) =>
              setMaximumRepaymentAmount(parseAmountToDecimals(e.target.value))
            }
            className="mb-1 p-1"
          />
          <label>NFT Collateral ID</label>
          <input
            type="text"
            onChange={(e) => setNftCollateralId(BigInt(e.target.value))}
            className="mb-1 p-1"
          />
          <label>Loan Duration (in seconds)</label>
          <input
            type="number"
            className="mb-1 p-1"
            onChange={(e) => setLoanDuration(BigInt(e.target.value))}
          />
          <span className="block text-gray text-xs mb-4">
            {formatDistance(
              new Date(),
              new Date().getTime() + Number(loanDuration) * 1000
            )}
          </span>
          <label>Loan Interest Rate for Duration in Basis Points</label>
          <input
            type="number"
            onChange={(e) =>
              setLoanInterestRateForDurationInBasisPoints(
                BigInt(e.target.value)
              )
            }
            className="mb-1 p-1"
          />
          <span className="block text-gray text-xs mb-4">
            {(Number(loanInterestRateForDurationInBasisPoints) || 0) / 100} %
          </span>
          <label>NFT Collateral Contract</label>
          <select
            onChange={(e) => setNftCollateralContract(e.target.value)}
            className="block mb-8 w-full p-1"
            value={nftCollateralContract ?? undefined}
          >
            {whitelistedContracts[network || 0]?.erc721tokens.map((token) => (
              <option value={token.address} key={token.address}>
                {token.name} - {token.address}
              </option>
            ))}
          </select>
          <label>Loan ERC20 Contract</label>
          <select
            onChange={(e) => setLoanERC20Denomination(e.target.value)}
            className="block mb-8 w-full p-1"
            value={loanERC20Denomination ?? undefined}
          >
            {whitelistedContracts[network || 0]?.erc20tokens.map((token) => (
              <option value={token.address} key={token.address}>
                {token.name} - {token.address}
              </option>
            ))}
          </select>
          <Button onClick={executeApproval}>Approve Usage of your NFT</Button>
        </>
      )}
      {step === Steps.LOADING && <div>Loading...</div>}
      {step === Steps.SIGNATURE && (
        <>
          <h1 className="text-lg mb-5">Sign Offer</h1>
          <Button onClick={executeSignature}>Sign Offer</Button>
        </>
      )}
      {step === Steps.END && (
        <>
          <h1 className="text-lg mb-5">Offer Made</h1>
          <Button
            onClick={() => {
              setStep(Steps.NFT_APPROVAL);
            }}
          >
            Make Another Offer
          </Button>
        </>
      )}
    </div>
  );
};

export default OfferMaker;
