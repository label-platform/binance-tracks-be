import {Logger} from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import {Server, Socket} from 'socket.io';
import {verifyAccessJWT} from "@src/utils/jwt";
import {User} from '@libs/l2e-queries/entities';
import {PlaySystemService} from "@src/modules/play-system/services/play-system.service";
import {PlayEventDto} from "@src/modules/play-system/dtos/play-events.dto";
import {SocketClientService} from "@src/modules/play-system/services/socket-client.service";

@WebSocketGateway({
  namespace: '/play/events',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  private server: Server;
  private logger: Logger = new Logger('WebSocketGateway');

  constructor(
    private readonly playSystemService: PlaySystemService,
    private readonly socketClientService: SocketClientService,
  ) {
  }

  afterInit(server: Server) {
    this.logger.log('Init');
  }

  async handleConnection(client: Socket) {
    this.logger.warn(`Client Connected: ${client.id}`);
    const accessToken = client.handshake.auth.token;
    if (accessToken) {
      try {
        const payload: User = verifyAccessJWT(accessToken.toString()) as User;
        const roomId = await this.socketClientService.addClient(client.id, payload.id);
        if (roomId) {
          this.server.to(client.id).emit('connected', 'ok');
        }else {
          this.logger.error(`Client cannot initialize room: ${client.id} - room error > disconnect`);
          this.server.to(client.id).emit('system-error', 'room_not_found');
          this.server.to(client.id).disconnectSockets();
        }
      } catch (e) {
        this.logger.error(`Client cannot verify: ${client.id} - error > disconnect`);
        this.server.to(client.id).emit('connected', `error`);
        this.server.to(client.id).disconnectSockets();
      }
    } else {
      this.logger.error(`Client no token: ${client.id} - error > disconnect`);
      this.server.to(client.id).emit('connected', 'no_token');
      this.server.to(client.id).disconnectSockets();
    }
    return true;
  }

  async handleDisconnect(client: Socket) {
    this.logger.warn(`Client Disconnected: ${client.id}`);

    const player = await this.socketClientService.getRoomPlayer(client.id);
    if (player) {
      // note: when client disconnect, we need to handle stop earning first if client not call stop earning event
      if (!player.isStoppedEarning) {
        await this.playSystemService.stopEarning(client.id, null);
      }
      await this.playSystemService.playStop(client.id, null);
    }
    return true;
  }

  private async validateClient(client: Socket): Promise<boolean> {
    try {
      const player = await this.socketClientService.getRoomPlayer(client.id);
      if (!player) {
        this.logger.warn(`Client cannot validate: ${client.id} - error > disconnect`);
        this.server.to(client.id).emit('system-error', 'validate_error');
        this.server.to(client.id).disconnectSockets();
        return false;
      }
      return true;
    } catch (e) {
      console.error('validateClient error:', e);
      this.logger.warn(`Client cannot validate: ${client.id} - error > disconnect`);
      this.server.to(client.id).disconnectSockets();
    }
  }

  @SubscribeMessage('start')
  async onEventPlayStart(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client play start: ${client.id}`);
    const validate = await this.validateClient(client);
    if (validate) {
      const start = await this.playSystemService.playStart(client.id, data);
      if (!start) {
        this.logger.warn(`Client cannot start: ${client.id} - error > disconnect`);
        this.server.to(client.id).emit('system-error', 'start_error');
        this.server.to(client.id).disconnectSockets();
      }
    }
    return data;
  }

  @SubscribeMessage('stop')
  async onEventPlayStop(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client play stop: ${client.id}`);

    const handleStop = await this.playSystemService.playStop(client.id, data);
    if (handleStop) {
      this.logger.warn(`Handle play stop: ${client.id} - ok > disconnect`);
      this.server.to(client.id).disconnectSockets();
    }
  }

  @SubscribeMessage('stop-earning')
  async onEventStopEarning(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client stop earning: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.stopEarning(client.id, data);
    }
  }

  @SubscribeMessage('pause')
  async onEventPause(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client pause: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.pause(client.id, data);
    }
  }

  @SubscribeMessage('continue')
  async onEventContinue(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client continue: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.continue(client.id, data);
    }
  }

  @SubscribeMessage('previous')
  async onEventPrevious(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client previous: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.previous(client.id, data);
    }
  }

  @SubscribeMessage('next')
  async onEventNext(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client next: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.next(client.id, data);
    }
  }

  @SubscribeMessage('skip')
  async onEventSkip(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client skip: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.skip(client.id, data);
    }
  }

  @SubscribeMessage('replay')
  async onEventReplay(client: Socket, data: PlayEventDto) {
    this.logger.log(`Client skip: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      await this.playSystemService.replay(client.id, data);
    }
  }

  @SubscribeMessage('update-energy')
  async onEventRemainingEnergy(client: Socket, data: PlayEventDto) {
    // note: mobile call emit event per 10s
    // note: emit remaining energy to mobile
    this.logger.log(`Client get remaining energy: ${client.id}`);

    const validate = await this.validateClient(client);
    if (validate) {
      const energy = await this.playSystemService.remainingEnergy(client.id, data);
      this.server.to(client.id).emit('update-remaining-energy', energy);
    }
  }
}
