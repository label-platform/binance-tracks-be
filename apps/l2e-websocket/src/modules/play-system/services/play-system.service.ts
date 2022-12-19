import { Injectable, Logger } from '@nestjs/common';
import {
  IRemainEnergy,
  ISongData,
} from '@src/modules/play-system/interfaces/websocket.interface';
import { InjectRedis, Redis } from '@nestjs-modules/ioredis';
import { PLAY_EVENTS } from '@src/common/common.constants';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { PlayEventDto } from '@src/modules/play-system/dtos/play-events.dto';
import https from 'https';
import * as fs from 'fs';
import { SocketClientService } from '@src/modules/play-system/services/socket-client.service';
import { PlayRoomService } from '@src/modules/play-system/services/play-room.service';
import { TIME_REWARD_TOKEN } from '@libs/l2e-utils/constants';

@Injectable()
export class PlaySystemService {
  private logger: Logger = new Logger('PlaySystemService');

  constructor(
    @InjectRedis() private readonly redis: Redis,
    @InjectQueue('earning') private readonly earningQueue: Queue,
    private readonly httpService: HttpService,
    private readonly clientService: SocketClientService,
    private readonly playRoomService: PlayRoomService
  ) {}

  private getBaseRequestURL(pathApi = '/'): string {
    return `${process.env.URL_SERVER}/api/${pathApi}`;
  }

  private async calculateEnergy(userId, playTime): Promise<any> {
    this.logger.debug(
      `calculateEnergy userId: ${userId}, playTime: ${playTime}`
    );
    if (playTime >= TIME_REWARD_TOKEN) {
      const updatedEnergy = await this.put(
        'energies/available-energy-by-times',
        {
          userId,
          playTime,
        }
      );
      // this.logger.warn(`updatedEnergy: ${JSON.stringify(updatedEnergy)}`);
      return updatedEnergy;
    }
    return null;
  }

  private async calculateBattery(userId, headphoneId, playTime): Promise<any> {
    this.logger.warn(
      `calculateBattery userId: ${userId}, headphoneId: ${headphoneId}, playTime: ${playTime}`
    );
    if (playTime >= TIME_REWARD_TOKEN) {
      const updatedBattery = await this.put(
        'inventories/headphones/reduce-battery',
        { userId, headphoneId, timeListened: playTime }
      );
      // this.logger.warn(`updatedBattery: ${JSON.stringify(updatedBattery)}`);
      return updatedBattery;
    }
    return null;
  }

  private async put(pathApi = '/', data): Promise<any> {
    try {
      const api = this.getBaseRequestURL(pathApi);
      const headers = {
        'Content-Type': 'application/json',
        'x-api-key': process.env['X_API_KEY'],
      };
      const httpsAgent = new https.Agent({
        rejectUnauthorized: false, // (NOTE: this will disable client verification)
        cert: fs.readFileSync('./cert.pem'),
        key: fs.readFileSync('./private.pem'),
        // passphrase: "YYY"
      });
      const resp = await lastValueFrom(
        this.httpService.put(api, data, { headers, httpsAgent: httpsAgent })
      );
      return resp.data;
    } catch (e) {
      this.logger.error({
        message: e.message,
        exception: e,
      });
      return null;
    }
  }

  public async getUserId(clientId: string): Promise<number> {
    const roomPlayer = await this.clientService.getRoomPlayer(clientId);
    return roomPlayer ? roomPlayer.userId : null;
  }

  public async playStart(
    clientId: string,
    data: PlayEventDto
  ): Promise<boolean> {
    this.logger.warn('playStart clientId: ' + clientId);
    const userId = await this.getUserId(clientId);
    if (!userId) {
      return false;
    }
    const songId = data.songId;
    const headphoneId = data.headphoneId;

    const value: ISongData = {
      songId,
      headphoneId,
      userId,
      playTime: 0,
      eventStatus: PLAY_EVENTS.START,
      startTime: new Date(),
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.START);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.START
    );
  }

  public async playStop(clientId, data?: PlayEventDto): Promise<boolean> {
    // note: battery of headphone decrease, energy of user decrease
    // pause + close app = disconnect socket = stop play
    // close app = disconnect socket = stop play

    this.logger.warn('playStop clientId: ' + clientId);
    const userId = await this.getUserId(clientId);
    if (userId) {
      if (data) {
        // if user stop
        const headphoneId = data.headphoneId;
        await this.calculateBattery(userId, headphoneId, data.playTime);
      } else {
        // if user close app / disconnect socket
        this.logger.warn(`Client close app or disconnect socket ${clientId}`);
        // note: get playTime = now - last playTime (last event), because user close app or disconnect socket can not send playTime (ignore events: pause & like pause, stop)
        const roomPlayer = await this.clientService.getRoomPlayer(clientId);
        const playingEvents = [
          PLAY_EVENTS.START,
          PLAY_EVENTS.CONTINUE,
          PLAY_EVENTS.STOP_EARNING,
          PLAY_EVENTS.UPDATE_ENERGY,
        ];
        if (roomPlayer && playingEvents.includes(roomPlayer.eventStatus)) {
          const roomData = await this.playRoomService.getRoomData(
            roomPlayer.roomId
          );
          const playTime = roomPlayer.eventUpdatedAt
            ? Math.floor(
                (new Date().getTime() -
                  new Date(roomPlayer.eventUpdatedAt).getTime()) /
                  1000
              )
            : 0; //second
          if (roomData && data.playTime > 0) {
            const headphoneId = roomData[0].headphoneId; // get headphoneId from first song, because user can only use 1 headphone
            await this.calculateBattery(userId, headphoneId, playTime);
          }
        }
      }

      // clear data
      return await this.disconnected(userId, clientId);
    }
    return false;
  }

  public async stopEarning(clientId: string, data?: PlayEventDto) {
    // note: calculate earning push queue, get end time and save to db, battery of headphone decrease, energy of user decrease
    this.logger.warn('stopEarning clientId: ' + clientId);
    if (data) {
      const userId = await this.getUserId(clientId);
      const songId = data.songId;
      const playTime = data.playTime; //second
      const value = {
        songId,
        userId,
        playTime,
      };
      const room = await this.playRoomService.updateRoomData(
        clientId,
        value,
        PLAY_EVENTS.STOP_EARNING
      );

      if (room) {
        await this.clientService.stopEarning(clientId);
        await this.earningQueue.add('calculate', {
          data: await this.playRoomService.getRoomData(clientId),
        });
      }
    } else {
      // note: if user close app / disconnect socket, stop earning first
      await this.earningQueue.add('calculate', {
        data: await this.playRoomService.getRoomData(clientId),
      });
    }
  }

  public async disconnected(
    userId: number,
    clientId: string
  ): Promise<boolean> {
    // note: same stop play
    this.logger.warn('disconnected > clear data clientId: ' + clientId);
    if ((await this.getUserId(clientId)) === userId) {
      await this.playRoomService.clearRoomData(clientId);
      await this.clientService.removeClient(clientId);
      return true;
    }
    return false;
  }

  public async pause(clientId: string, data: PlayEventDto): Promise<boolean> {
    // pause => play start again = continue play
    // skip song + continue play = play start again
    // events: pause => continue
    const userId = await this.getUserId(clientId);
    const songId = data.songId;
    const playTime = data.playTime; //second
    const value = {
      songId,
      userId,
      playTime,
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.PAUSE);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.PAUSE
    );
  }

  public async continue(
    clientId: string,
    data: PlayEventDto
  ): Promise<boolean> {
    // pause => play start again = continue play
    // skip song + continue play = play start again

    const userId = await this.getUserId(clientId);
    const songId = data.songId;
    const value = {
      songId,
      userId,
      playTime: 0,
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.CONTINUE);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.CONTINUE
    );
  }

  public async skip(clientId: string, data: PlayEventDto): Promise<boolean> {
    // fast-forward or rewind the song
    // events: skip => continue
    const userId = await this.getUserId(clientId);
    const songId = data.songId;
    const value = {
      songId,
      userId,
      playTime: 0,
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.SKIP);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.SKIP
    );
  }

  public async previous(
    clientId: string,
    data: PlayEventDto
  ): Promise<boolean> {
    // play previous song if playTime < 10s
    // events: previous => continue
    const userId = await this.getUserId(clientId);
    const songId = data.songId;
    const value = {
      songId,
      userId,
      playTime: 0,
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.PREVIOUS);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.PREVIOUS
    );
  }

  public async replay(clientId: string, data: PlayEventDto): Promise<boolean> {
    // replay song if playTime >= 10s
    // events: replay => continue
    const userId = await this.getUserId(clientId);
    const songId = data.songId;
    const playTime = data.playTime; //second
    const value = {
      songId,
      userId,
      playTime,
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.REPLAY);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.REPLAY
    );
  }

  public async next(clientId: string, data: PlayEventDto): Promise<boolean> {
    // events: next: start new song => pause => continue
    const userId = await this.getUserId(clientId);
    const value = {
      headphoneId: data.headphoneId,
      songId: data.songId,
      userId,
      playTime: 0,
      eventStatus: PLAY_EVENTS.START,
      startTime: new Date(),
    };
    await this.clientService.setEventStatus(clientId, PLAY_EVENTS.NEXT);
    return await this.playRoomService.updateRoomData(
      clientId,
      value,
      PLAY_EVENTS.NEXT
    );
  }

  public async remainingEnergy(
    clientId: string,
    data: PlayEventDto
  ): Promise<IRemainEnergy> {
    // note: calculate remaining energy

    this.logger.warn('remainingEnergy clientId: ' + clientId);
    const userId = await this.getUserId(clientId);
    const headphoneId = data.headphoneId;
    const playTime = data.playTime; //second

    await this.clientService.setEventStatus(
      clientId,
      PLAY_EVENTS.UPDATE_ENERGY
    );
    await this.playRoomService.updateRoomData(
      clientId,
      data,
      PLAY_EVENTS.UPDATE_ENERGY
    );

    const energy = await this.calculateEnergy(userId, playTime);
    const battery = await this.calculateBattery(userId, headphoneId, playTime);

    const remaining = {
      energy: 0,
      battery: 0,
    };
    if (energy) {
      this.logger.warn(`remainingEnergy energy: ${JSON.stringify(energy)}`);
      remaining.energy = energy.availableEnergy;
    }
    if (battery) {
      this.logger.warn(`battery: ${JSON.stringify(battery)}`);
      remaining.battery = battery.battery;
    }
    return remaining;
  }
}
