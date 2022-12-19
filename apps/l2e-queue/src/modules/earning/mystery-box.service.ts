import { HttpService } from "@nestjs/axios";
import { Injectable } from "@nestjs/common";
import { lastValueFrom, map } from "rxjs";
import https from 'https';
import * as fs from 'fs';
import { Logger } from "ethers/lib/utils";

@Injectable()
export class MysteryBoxService {

  constructor(
    private readonly httpService: HttpService
  ) {
  }

  async callApiService({ userId, headphoneId, energyConsumption: totalCumulativePlayTime }) {
    console.log(`callApiCreateMysteryBox userId: ${userId}, headphoneId: ${headphoneId}, playTime: ${totalCumulativePlayTime}`);
    const httpsAgent = new https.Agent({
      rejectUnauthorized: false, // (NOTE: this will disable client verification)
      cert: fs.readFileSync("./cert.pem"),
      key: fs.readFileSync("./private.pem"),
      // passphrase: "YYY"
    })
    lastValueFrom(this.httpService.post(`${process.env.URL_SERVER}/api/inventories/mystery-boxes`, JSON.stringify({ userId, headphoneId, energyConsumption: totalCumulativePlayTime }), {
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env['X_API_KEY']
      },
      httpsAgent: httpsAgent
    })
    ).then((res) => {
      return res.data
    }).catch(err => {
      console.log(err)
    })
  }
}
