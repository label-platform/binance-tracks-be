import BigNumber from 'bignumber.js';
import { SpendingBalance } from '@libs/l2e-queries/entities';
import { ItemType } from '@libs/l2e-queries/dtos';
import { EntityManager } from 'typeorm';

export interface IVerifyNativeBalanceInput {
  userId: number;
  walletAddress: string;
  tokenAddress?: string;
  amount?: string;
  collectionAddress?: string;
  tokenId?: number;
}

export interface IVerifyNativeBalanceOutput {
  gasLimit: BigNumber;
  nativeSpendingBalance: SpendingBalance;
}

export interface IUpdateWithdrawnTokenBalance {
  amountWithdraw: BigNumber;
  spendingBalanceBeWithdrawn: SpendingBalance;
  manager: EntityManager;
}

export interface ICreateWithDrawnTokenRecord {
  tokenAddress?: string;
  amountWithdraw?: BigNumber;
  userId: number;
  walletAddress: string;
  collectionAddress?: string;
  tokenId?: number;
  itemType?: ItemType;
  nftId?: number;
  manager: EntityManager;
}
