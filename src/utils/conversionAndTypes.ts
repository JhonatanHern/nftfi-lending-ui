export type OnChainLoan = {
  loanid: BigInt;
  loanprincipalamount: BigInt;
  maximumrepaymentamount: BigInt;
  nftcollateralid: BigInt;
  loanstarttime: Date;
  loanduration: number;
  loaninterestratefordurationinbasispoints: number;
  loanadminfeeinbasispoints: number;
  nftcollateralcontract: string; // ERC721 contract address
  loanerc20denomination: string; // ERC20 contract address
  borrower: string; // Address of the borrower
  interestisprorated: boolean;
};

export const blockchainDataToOnChainLoan = (data: any) => {
  const res: OnChainLoan = {
    loanid: data[0],
    loanprincipalamount: data[1],
    maximumrepaymentamount: data[2],
    nftcollateralid: data[3],
    loanstarttime: new Date(Number(data[4] * BigInt(1000))),
    loanduration: data[5],
    loaninterestratefordurationinbasispoints: data[6],
    loanadminfeeinbasispoints: data[7],
    nftcollateralcontract: data[8], // ERC721 contract address
    loanerc20denomination: data[9], // ERC20 contract address
    borrower: data[10], // Address of the borrower
    interestisprorated: data[11],
  };
  return res;
};
