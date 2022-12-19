import {Injectable, Logger} from "@nestjs/common";
import {IConnectedUser, ISongData} from "@src/modules/play-system/interfaces/websocket.interface";
import {InjectRedis, Redis} from "@nestjs-modules/ioredis";
import {PLAY_EVENTS, ROOM_DATA} from "@src/common/common.constants";
import {PlayEventDto} from "@src/modules/play-system/dtos/play-events.dto";
import {SocketClientService} from "@src/modules/play-system/services/socket-client.service";

/**
 * Store connected user data in redis with socket id as key
 * Manage connected user data in play session
 * */
@Injectable()
export class PlayRoomService {
  private logger: Logger = new Logger('PlayRoomService');

  constructor(
    @InjectRedis() private readonly redis: Redis,
    private readonly clientService: SocketClientService
  ) {
  }

  private getRoomDataKey(roomId: string): string {
    return ROOM_DATA + '_' + roomId;
  }

  public async getRoomData(clientId: string): Promise<ISongData[] | null> {
    const roomId = await this.clientService.getRoomId(clientId);
    if (!roomId) {
      this.logger.error('Room not found');
      return null;
    }
    const key = this.getRoomDataKey(roomId);
    const roomData = await this.redis.get(key);
    return roomData ? JSON.parse(roomData) : [];
  }

  public async updateRoomData(clientId: string, data: PlayEventDto, event = null): Promise<boolean> {
    this.logger.warn(`updateRoomData clientId:  ${clientId} - data: ${JSON.stringify(data)}`);
    const roomId = await this.clientService.getRoomId(clientId);
    if (!roomId) {
      this.logger.error('Room not found');
      return false;
    }
    const key = this.getRoomDataKey(roomId);
    const roomData = await this.redis.get(key);
    let playData: ISongData[] = roomData ? JSON.parse(roomData) : [];

    const songData = playData.find((item) => item.songId === data.songId);
    if (!songData && (event === PLAY_EVENTS.START || event === PLAY_EVENTS.NEXT)) {
      // start => create new data
      playData.push(<ISongData>data);
      await this.redis.set(key, JSON.stringify(playData));
      this.logger.log(`Event: ${event} > Create song data: ${JSON.stringify(data)}`);
    } else if (songData) {
      this.logger.log(`Event: ${event} > Update song data: ${JSON.stringify(data)}`);
      playData = playData.map((item) => {
        if (item.songId === data.songId) {
          item.playTime += data.playTime; //cumulative play time
          item.eventStatus = event ? event : item.eventStatus;
          return item;
        }
        return item;
      });
      await this.redis.set(key, JSON.stringify(playData));
    }
    return true;
  }

  public async clearRoomData(clientId: string): Promise<boolean> {
    const roomId = await this.clientService.getRoomId(clientId);
    if (!roomId) {
      this.logger.error('Room not found');
      return false;
    }
    const key = this.getRoomDataKey(roomId);
    await this.redis.del(key);
    return true;
  }

}
