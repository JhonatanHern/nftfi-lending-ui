import { ethers } from "ethers";

export const verifyLoginSignature = (signature: string, address: string) => {
  return (
    ethers
      .verifyMessage("Sign In to Hypercycle's lending interface", signature)
      .toLowerCase() === address.toLowerCase()
  );
};
