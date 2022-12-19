import {Injectable, Logger} from "@nestjs/common";
import {IConnectedUser} from "@src/modules/play-system/interfaces/websocket.interface";
import {InjectRedis, Redis} from "@nestjs-modules/ioredis";
import {v4 as uuidv4} from 'uuid';
import {PLAY_EVENTS, ROOM_PLAYER} from "@src/common/common.constants";

/**
 * Store connected user data in redis with socket id as key
 * Manage connected user data in play session
 * */
@Injectable()
export class SocketClientService {
  private logger: Logger = new Logger('SocketClientService');

  constructor(
    @InjectRedis() private readonly redis: Redis
  ) {
  }

  private getRoomPlayerKey(clientId: string): string {
    return ROOM_PLAYER + '_' + clientId;
  }

  /**
  * @return roomId
  * */
  private async setRoomPlayerKey(clientId: string, connectedUser: IConnectedUser): Promise<string> {
    const roomId = uuidv4();
    const roomKey = this.getRoomPlayerKey(clientId);
    connectedUser.roomId = roomId;
    const status = await this.redis.set(roomKey, JSON.stringify(connectedUser));
    if (status === 'OK') {
      return roomId;
    }
    return null;
  }

  /**
   * Set last event status
   * */
  public async setEventStatus(clientId: string, eventStatus: string): Promise<boolean> {
    const roomPlayer = await this.getRoomPlayer(clientId);
    if (roomPlayer) {
      roomPlayer.eventStatus = eventStatus;
      roomPlayer.eventUpdatedAt = new Date();
      const roomKey = this.getRoomPlayerKey(clientId);
      await this.redis.set(roomKey, JSON.stringify(roomPlayer));
      return true;
    }
    return false;
  }

  /**
   * Set stop earning status
   * @param clientId
   */
  public async stopEarning(clientId: string): Promise<boolean> {
    const roomPlayer = await this.getRoomPlayer(clientId);
    if (roomPlayer) {
      roomPlayer.isStoppedEarning = true;
      roomPlayer.eventStatus = PLAY_EVENTS.STOP_EARNING;
      roomPlayer.eventUpdatedAt = new Date();
      const roomKey = this.getRoomPlayerKey(roomPlayer.clientId);
      await this.redis.set(roomKey, JSON.stringify(roomPlayer));
      return true;
    }
    return false;
  }

  /**
  * @return roomId
  * */
  public async addClient(clientId: string, userId: number): Promise<string> {
    this.logger.warn(`addClient: ${clientId}, ${userId}`);
    const roomPlayer = await this.getRoomPlayer(clientId);
    if (!roomPlayer) {
      const connectedUser: IConnectedUser = {
        userId,
        clientId,
        connectedAt: new Date(),
        eventStatus: 'connected',
        eventUpdatedAt: new Date(),
        isStoppedEarning: false,
      }
      return await this.setRoomPlayerKey(clientId, connectedUser);
    } else {
      return roomPlayer.roomId;
    }
  }

  /**
   * Get room player data from redis with client id
   * @return IConnectedUser
   * */
  public async getRoomPlayer(clientId: string): Promise<IConnectedUser> {
    const roomKey = this.getRoomPlayerKey(clientId);
    const roomPlayer = await this.redis.get(roomKey);
    if (roomPlayer) {
      return JSON.parse(roomPlayer) as IConnectedUser;
    } else {
      return null;
    }
  }

  /**
   * Remove room player data from redis with client id
   * @param clientId
   */
  public async removeClient(clientId: string): Promise<boolean> {
    this.logger.warn(`removeClient: ${clientId}`);
    const roomPlayer = await this.getRoomPlayer(clientId);
    if (roomPlayer) {
      const roomKey = this.getRoomPlayerKey(clientId);
      await this.redis.del(roomKey);
      return true;
    }
    return false;
  }

  /**
   * Get room id from redis with client id
   * @param clientId
   */
  public async getRoomId(clientId: string): Promise<string> {
    const roomPlayer = await this.getRoomPlayer(clientId);
    if (roomPlayer) {
      return roomPlayer.roomId;
    } else {
      return null;
    }
  }

  /**
   * Get room id from redis with user id
   * @param userId
   */
  public async getRoomIdByUserId(userId: number): Promise<string> {
    const roomPlayer = await this.getRoomPlayerByUserId(userId);
    if (roomPlayer) {
      return roomPlayer.roomId;
    } else {
      return null;
    }
  }

  private async getRoomPlayerByUserId(userId: number) {
    const roomPlayers = await this.redis.keys(ROOM_PLAYER + '_*');
    for (const roomPlayer of roomPlayers) {
      const roomPlayerData = await this.redis.get(roomPlayer);
      const roomPlayerObj = JSON.parse(roomPlayerData) as IConnectedUser;
      if (roomPlayerObj.userId === userId) {
        return roomPlayerObj;
      }
    }
    return null;
  }
}
