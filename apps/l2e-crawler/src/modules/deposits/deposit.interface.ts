import BigNumber from 'bignumber.js';
import { ItemType } from '@libs/l2e-queries/dtos';

export interface ICreateDepositTokenRecord {
  tokenAddress?: string;
  amountWithdraw?: BigNumber;
  userId: number;
  walletAddress: string;
  collectionAddress?: string;
  tokenId?: number;
  itemType?: ItemType;
  nftId?: number;
}
