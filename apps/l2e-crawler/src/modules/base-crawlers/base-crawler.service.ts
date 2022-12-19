import { Inject, Injectable } from '@nestjs/common';
import { BaseCrawlerOptions } from '@base-crawlers/base-crawler.interface';
import {
  CONFIG_BASE_CRAWLER_OPTIONS,
  DEPOSIT_NFT_EVENT,
  DEPOSIT_TOKEN_EVENT,
  TIME_STEP_CRAWL_IN_MILLISECONDS,
} from '@base-crawlers/base-crawler.constant';
import { CrawlerLogService } from '@crawler-logs/crawler-log.service';
import { DepositService } from '@deposits/deposit.service';
import { CrawlerLog } from '@libs/l2e-queries/entities';
import { getContract, getWeb3Instance } from '@libs/l2e-utils/util-functions';

@Injectable()
export class BaseCrawlerService {
  constructor(
    @Inject(CONFIG_BASE_CRAWLER_OPTIONS)
    private readonly baseCrawlerOptions: BaseCrawlerOptions,
    private readonly crawlerLogService: CrawlerLogService,
    private readonly depositService: DepositService
  ) {}

  async crawlBlock(no: number, fromBlock: number, toBlock: number) {
    const { contractAddress, abi } = this.baseCrawlerOptions;
    const contractInstance = getContract(abi, contractAddress);
    try {
      console.log('====================================');
      console.log(`Crawl contract address:  ${contractAddress}`);
      console.log('from', fromBlock);
      console.log('to', toBlock);
      console.log('====================================');
      const events = await contractInstance.getPastEvents('AllEvents', {
        fromBlock: fromBlock,
        toBlock: toBlock,
      });

      const handleEventPromise = [];
      for (const event of events) {
        handleEventPromise.push(this.handleEvent(event));
      }
      await Promise.all(handleEventPromise);

      await this.crawlerLogService.createCrawlerLog({
        no,
        fromBlock,
        toBlock,
        contractAddress,
      });
    } catch (error) {
      console.log(error.message);
      return;
    }
  }

  async handleEvent(event: any) {
    if (event.event === DEPOSIT_TOKEN_EVENT) {
      await this.depositService.depositToken(event);
    }

    if (event.event === DEPOSIT_NFT_EVENT) {
      await this.depositService.depositNft(event);
    }
  }

  async getLatestCrawlBlockAndNoLog(): Promise<{
    lastestBlockCrawler: number;
    no: number;
  }> {
    const contractAddress: string = this.baseCrawlerOptions.contractAddress;
    const startBlock: number = this.baseCrawlerOptions.startBlock;
    const crawlerLog: CrawlerLog =
      await this.crawlerLogService.getLastestCrawlerLog(contractAddress);
    const lastestBlockCrawler =
      +crawlerLog?.toBlock > startBlock ? +crawlerLog?.toBlock : startBlock - 1;
    const no = +crawlerLog?.no || 0;
    return {
      lastestBlockCrawler,
      no,
    };
  }

  async scan() {
    const { lastestBlockCrawler, no } =
      await this.getLatestCrawlBlockAndNoLog();
    const web3Instance = getWeb3Instance();
    let startBlockCrawler = lastestBlockCrawler + 1;
    let currentNo = no + 1;

    setInterval(async () => {
      try {
        let latestBlock: number;

        latestBlock = await web3Instance.eth.getBlockNumber();

        if (!latestBlock) return;

        latestBlock = Math.min(
          latestBlock - 5,
          startBlockCrawler + this.baseCrawlerOptions.blockStep
        );

        if (latestBlock > startBlockCrawler) {
          await this.crawlBlock(currentNo, startBlockCrawler, latestBlock);
          startBlockCrawler = latestBlock + 1;
          currentNo += 1;
        }
      } catch (error) {
        console.log(error.message);
        return;
      }
    }, TIME_STEP_CRAWL_IN_MILLISECONDS);
  }
}
