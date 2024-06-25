export type WhitelistedContract = {
  address: `0x${string}`;
  name: string;
  symbol: string;
  decimals?: number;
};

type WhitelistedContracts = {
  [networkId: number]: {
    erc721tokens: WhitelistedContract[];
    erc20tokens: WhitelistedContract[];
    NFTfi: `0x${string}`;
    DataPacker: `0x${string}`;
    chainName: string;
  };
};

export const whitelistedContracts: WhitelistedContracts = {
  1: {
    chainName: "Mainnet",
    NFTfi: "0x",
    DataPacker: "0x",
    erc721tokens: [],
    erc20tokens: [],
  },
  11155111: {
    chainName: "Sepolia",
    NFTfi: "0x563D6115822088A107F2569CFB24BD09Abc35673",
    DataPacker: "0xC163AC57b9c63cB6589Eb6a10470E3a1d60a070B",
    erc721tokens: [
      {
        address: "0x3F8a32b96f451758f90A62A30C0a564AE2Ce2766",
        name: "ExampleNFT",
        symbol: "EXNFT",
      },
    ],
    erc20tokens: [
      {
        address: "0x640b1274387bf529D016d74161D09c13951867E8",
        name: "Test HYPC",
        symbol: "T-HYPC",
        decimals: 6,
      },
    ],
  },
};
