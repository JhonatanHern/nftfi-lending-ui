import { config } from "@/wagmi";
import { signMessage } from "@wagmi/core";

export const getLoginSignature = async (address: string) => {
  const itemKey = "login-signature-" + address;
  const existingSignature = localStorage.getItem(itemKey);
  if (existingSignature) {
    return existingSignature;
  }
  const newSignature = await signMessage(config, {
    message: "Sign In to Hypercycle's lending interface",
  });
  localStorage.setItem(itemKey, newSignature);
  return newSignature;
};
