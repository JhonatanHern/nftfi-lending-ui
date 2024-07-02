import { ethers } from "ethers";

export const getProviderByNetwork = (id: string) => {
  switch (id) {
    case "11155111": // sepolia
      return new ethers.JsonRpcProvider(process.env.SEPOLIA_URL + "");
    case "1": // mainnet
      return new ethers.JsonRpcProvider(process.env.MAINNET_URL + "");
    default:
      throw new Error("Network not supported for backend checking");
  }
};
