import { ethers } from 'ethers';

export const checkSignedMessage = (
  message: string,
  signedMessage: string,
  walletAddress: string
): boolean => {
  const signerAddress = ethers.utils.verifyMessage(message, signedMessage);
  return signerAddress.toLowerCase() === walletAddress.toLowerCase();
};

export const convertPriceToBigDecimals = (price: any, decimal: number) => {
  const res = ethers.utils.parseUnits(price.toString(), decimal);
  return res.toString();
};

export const convertBigDecimalsValueToNumber = (
  weiBalance: any,
  decimal: number
) => {
  const res = ethers.utils.formatUnits(weiBalance, decimal).toString();
  return Number(res);
};
