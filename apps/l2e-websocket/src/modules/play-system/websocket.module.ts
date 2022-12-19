import {Logger, Module} from '@nestjs/common';
import {WebsocketGateway} from './websocket.gateway';
import {PlaySystemService} from "@src/modules/play-system/services/play-system.service";
import {TypeOrmModule} from "@nestjs/typeorm";
import {User} from "@libs/l2e-queries/entities";
import {BullModule} from "@nestjs/bull";
import {HttpModule} from "@nestjs/axios";
import {SocketClientService} from "@src/modules/play-system/services/socket-client.service";
import {PlayRoomService} from "@src/modules/play-system/services/play-room.service";

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
    BullModule.registerQueue({
      name: 'earning',
    }),
    HttpModule
  ],
  providers: [
    WebsocketGateway,
    PlaySystemService,
    SocketClientService,
    PlayRoomService,
    Logger
  ],
  exports: [
    PlaySystemService,
    SocketClientService,
    PlayRoomService,
  ],
})
export class WebsocketModule {
}
