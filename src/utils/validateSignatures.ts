import { Offer } from "@prisma/client";
import NFTfiABI from "../utils/abis/NFTfi.json";
import { ethers } from "ethers";
import { getProviderByNetwork } from "./provider";
import { whitelistedContracts } from "./whitelistedContracts";

const getNFTfiInstance = (network: string) => {
  const provider = getProviderByNetwork(network);
  const contractAddress = whitelistedContracts[Number(network)].NFTfi;
  const contractInstance = new ethers.Contract(
    contractAddress,
    NFTfiABI,
    provider
  );
  return contractInstance;
};

export const isValidBorrowerSignature = async (
  nftCollateralId: string,
  borrowerNonce: string,
  nftCollateralContract: string,
  borrowerAddress: string,
  signature: string,
  network: string
) => {
  console.log("borrower signature validation started");

  const nftfi = getNFTfiInstance(network);
  console.log("obtained instance");

  const validSignature = await nftfi.isValidBorrowerSignature(
    nftCollateralId,
    borrowerNonce,
    nftCollateralContract,
    borrowerAddress,
    signature
  );
  console.log("validation function called: ", validSignature);

  return validSignature;
};
export const isValidLenderSignature = async (
  offer: Offer,
  signature: string,
  lenderNonce: string,
  signerAddress: string,
  network: string
) => {
  console.log("lender signature validation started");
  const nftfi = getNFTfiInstance(network);
  const validSignature = await nftfi.isValidLenderSignature(
    offer.loanPrincipalAmount, // uint256 _loanPrincipalAmount,
    offer.maximumRepaymentAmount, // uint256 _maximumRepaymentAmount,
    offer.nftCollateralId, // uint256 _nftCollateralId,
    offer.loanDuration, // uint256 _loanDuration,
    offer.loanInterestRateForDurationInBasisPoints, // uint256 _loanInterestRateForDurationInBasisPoints,
    offer.adminFeeInBasisPoints, // uint256 _adminFeeInBasisPoints,
    lenderNonce, // uint256 _lenderNonce,
    offer.nftCollateralContract, // address _nftCollateralContract,
    offer.loanERC20Denomination, // address _loanERC20Denomination,
    signerAddress, // address _lender,
    offer.loanInterestRateForDurationInBasisPoints != 4294967295, // bool _interestIsProRated
    signature
  );
  console.log("lender validation function called: ", validSignature);
  return validSignature;
};
