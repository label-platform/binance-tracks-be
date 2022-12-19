import Web3 from 'web3';
import { ERC20ABI, ERC721ABI } from '../abis';
import { Logger } from '@nestjs/common';
import { TokenInfos } from '../constants';

let singleWebInstance;

export const getWeb3Instance = (): Web3 => {
  if (!singleWebInstance) {
    singleWebInstance = new Web3(
      new Web3.providers.HttpProvider(process.env.PROVIDER)
    );
  }

  return singleWebInstance;
};

export const getContract = (abi: any, contract: string) => {
  const web3Instance = getWeb3Instance();
  return new web3Instance.eth.Contract(abi, contract);
};

export const getGasPrice = () => {
  const web3Instance = getWeb3Instance();
  return web3Instance.eth.getGasPrice();
};

export const getTokenInformation = async (tokenAddress: string) => {
  if (tokenAddress === TokenInfos.BNB.address) {
    return {
      tokenSymbol: TokenInfos.BNB.symbol,
      tokenDecimals: TokenInfos.BNB.decimals,
    };
  }
  const tokenERC20ContractInstance = getContract(ERC20ABI, tokenAddress);
  const tokenSymbol = await tokenERC20ContractInstance.methods.name().call();
  const tokenDecimals = await tokenERC20ContractInstance.methods
    .decimals()
    .call();

  return {
    tokenSymbol,
    tokenDecimals,
  };
};

export const estimateGasTransferToken = async (
  fromAddress: string,
  toAddress: string,
  tokenAddress: string,
  amount: string
) => {
  const tokenERC20ContractInstance = getContract(ERC20ABI, tokenAddress);
  const web3Instance = getWeb3Instance();
  const valueTransferred = Web3.utils.toWei(amount, 'ether');

  const gasLimit =
    tokenAddress === TokenInfos.BNB.address
      ? await web3Instance.eth.estimateGas({
          from: fromAddress,
          to: toAddress,
          value: valueTransferred,
        })
      : await tokenERC20ContractInstance.methods
          .transfer(toAddress, valueTransferred)
          .estimateGas({ from: fromAddress });

  return Web3.utils.fromWei(String(gasLimit), 'ether');
};

export const estimateGasTransferNft = async (
  fromAddress: string,
  toAddress: string,
  collectionAddress: string,
  tokenId: number
) => {
  const tokenERC721ContractInstance = getContract(ERC721ABI, collectionAddress);
  const gasLimit = await tokenERC721ContractInstance.methods
    .transferFrom(fromAddress, toAddress, tokenId)
    .estimateGas({ from: fromAddress });
  return Web3.utils.fromWei(String(gasLimit), 'ether');
};

export const getOwner = async (collectionAddress: string, tokenId: number) => {
  const tokenERC721ContractInstance = getContract(ERC721ABI, collectionAddress);
  return await tokenERC721ContractInstance.methods.ownerOf(tokenId).call();
};

// export const getTransferNftTransaction = async (
//   fromAddress: string,
//   toAddress: string,
//   collectionAddress: string,
//   tokenId: number
// ) => {
//   const tokenERC721ContractInstance = getContract(ERC721ABI, collectionAddress);
//   const data = await tokenERC721ContractInstance.methods
//     .transferFrom(fromAddress, toAddress, tokenId)
//     .encodeABI();
//   const gas = await tokenERC721ContractInstance.methods
//     .transferFrom(fromAddress, toAddress, tokenId)
//     .estimateGas({ from: fromAddress });
//   const web3Instance = getWeb3Instance();
//   const gasPrice = await web3Instance.eth.getGasPrice();
//   // const nonce = (await web3Instance.eth.getTransactionCount()) + 1;

//   return {
//     from: fromAddress,
//     to: collectionAddress,
//     data,
//     gas,
//     gasPrice,
//     // nonce,
//   };
// };

// export const getSignedTransaction = async (
//   transaction: any,
//   privateKey: string
// ) => {
//   const web3Instance = getWeb3Instance();
//   return await web3Instance.eth.accounts.signTransaction(
//     transaction,
//     privateKey
//   );
// };

// export const sendRawTransaction = async (rawTransaction: string) => {
//   const web3Instance = getWeb3Instance();
//   return await web3Instance.eth.sendSignedTransaction(rawTransaction);
// };

export const sendTransferNftTransaction = async (
  fromAddress: string,
  toAddress: string,
  collectionAddress: string,
  tokenId: number,
  privateKey: string
) => {
  const tokenERC721ContractInstance = getContract(ERC721ABI, collectionAddress);
  const estimateGas = await tokenERC721ContractInstance.methods
    .transferFrom(fromAddress, toAddress, tokenId)
    .estimateGas({ from: fromAddress });

  const web3Instance = getWeb3Instance();
  await web3Instance.eth.accounts.wallet.add(privateKey);
  return await tokenERC721ContractInstance.methods
    .transferFrom(fromAddress, toAddress, tokenId)
    .send({ from: fromAddress, gas: estimateGas });

  // const testEvent = tokenERC721ContractInstance.events
  //   .Transfer(
  //     {
  //       fromBlock: 'latest',
  //     },
  //     (error, event) => {
  //       console.log(event);
  //     }
  //   )
  //   .on('connected', (subscriptionId) => {
  //     console.log(subscriptionId);
  //   })
  //   .on('data', (event) => {
  //     console.log(event);
  //   });

  // tokenERC721ContractInstance
  //   .getPastEvents('Transfer', { fromBlock: 'latest' }, (error, events) => {
  //     console.log(events);
  //   })
  //   .then((events) => {
  //     console.log(events);
  //   });
  // const subscription = web3Instance.eth.subscribe(
  //   'logs',
  //   {
  //     address: collectionAddress,
  //   },
  //   (error, result) => {
  //     if (!error) console.log(result);
  //   }
  // );

  // await new Promise((res) => setTimeout(res, 60000));

  // subscription.unsubscribe((error, success) => {
  //   if (success) console.log('Successfully unsubscribed!');
  // });

  // TODO: 꼬였을 경우에 처리 방안 추가 필요. 아래 예시는 이미 전송이 됐는데 DB 처리가 안된 경우임
  //  error: execution reverted: ERC721: transfer caller is not owner nor approved
  // return txResult;
};

export const mintNftTransaction = async (
  adminAddress: string,
  toAddress: string,
  collectionAddress: string,
  privateKey: string
) => {
  const tokenERC721ContractInstance = getContract(ERC721ABI, collectionAddress);
  const estimateGas = await tokenERC721ContractInstance.methods
    .mint(adminAddress, 1)
    .estimateGas({ from: adminAddress });

  const web3Instance = getWeb3Instance();
  await web3Instance.eth.accounts.wallet.add(privateKey);
  const txResult = await tokenERC721ContractInstance.methods
    .mint(adminAddress, 1)
    .send({ from: adminAddress, gas: estimateGas });

  // TODO: 꼬였을 경우에 처리 방안 추가 필요. 아래 예시는 이미 mint가 됐는데 DB 처리가 안된 경우임
  //  error: execution reverted: ERC721: mint caller is not owner nor approved
  return txResult;
};

export const sendTransferTokenTransaction = async (
  fromAddress: string,
  toAddress: string,
  tokenAddress: string,
  amount: string,
  privateKey: string
) => {
  const web3Instance = getWeb3Instance();
  await web3Instance.eth.accounts.wallet.add(privateKey);
  const valueTransferred = Web3.utils.toWei(amount, 'ether');

  let txResult;
  // BNB의 경우 admin wallet에서 전송
  switch (tokenAddress) {
    case TokenInfos.BNB.address: {
      try {
        const gasLimit = await web3Instance.eth.estimateGas({
          from: fromAddress,
          to: toAddress,
          value: valueTransferred,
        });
        txResult = await web3Instance.eth.sendTransaction({
          from: fromAddress,
          to: toAddress,
          value: valueTransferred,
          gas: gasLimit,
        });
      } catch (error) {
        // TODO: exception 처리
        Logger.error(error);
      }

      break;
    }

    // LBL, BLB의 경우 admin wallet에서 transfer
    case TokenInfos.LBL.address:
    case TokenInfos.BLB.address: {
      try {
        const tokenERC20ContractInstance = getContract(ERC20ABI, tokenAddress);
        const gasLimit = await tokenERC20ContractInstance.methods
          .transfer(toAddress, valueTransferred)
          .estimateGas({ from: fromAddress });
        txResult = await tokenERC20ContractInstance.methods
          .transfer(toAddress, valueTransferred)
          .send({ from: fromAddress, gas: gasLimit });
      } catch (error) {
        // TODO: exception 처리
        Logger.error(error);
      }

      break;
    }

    default:
      Logger.error('sendTransferTokenTransaction: tokenAddress is not valid');
      break;
  }

  return txResult;
};

export const getTransactionReceipt = async (txHash: string) => {
  const web3Instance = getWeb3Instance();
  const transactionReceipt = await web3Instance.eth.getTransactionReceipt(
    txHash
  );
  return transactionReceipt;
};

export const getTokenBalanceOf = async (
  account: string,
  contractAddress: string
) => {
  const tokenERC20ContractInstance = getContract(ERC20ABI, contractAddress);
  return Number(
    Number(
      Web3.utils.fromWei(
        await tokenERC20ContractInstance.methods.balanceOf(account).call(),
        'ether'
      )
    ).toFixed(4)
  );
};

export const getBalanceOf = async (account: string) => {
  const web3Instance = getWeb3Instance();

  return Number(
    Number(
      Web3.utils.fromWei(await web3Instance.eth.getBalance(account), 'ether')
    ).toFixed(4)
  );
};
