export type BeginLoanParams = {
  loanPrincipalAmount: bigint;
  maximumRepaymentAmount: bigint;
  nftCollateralId: bigint;
  loanDuration: bigint;
  loanInterestRateForDurationInBasisPoints: bigint;
  adminFeeInBasisPoints: bigint;
  borrowerAndLenderNonces: [bigint, bigint];
  nftCollateralContract: string;
  loanERC20Denomination: string;
  lender: string;
  borrowerSignature: string;
  lenderSignature: string;
};

export const rawArgsToBeginLoanParams = (params: any[]): BeginLoanParams => {
  return {
    loanPrincipalAmount: params[0],
    maximumRepaymentAmount: params[1],
    nftCollateralId: params[2],
    loanDuration: params[3],
    loanInterestRateForDurationInBasisPoints: params[4],
    adminFeeInBasisPoints: params[5],
    borrowerAndLenderNonces: [params[6][0], params[6][1]],
    nftCollateralContract: params[7],
    loanERC20Denomination: params[8],
    lender: params[9],
    borrowerSignature: params[10],
    lenderSignature: params[11],
  };
};
