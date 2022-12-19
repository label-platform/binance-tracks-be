export interface IConnectedUser {
  roomId?: string;
  userId?: number;
  clientId: string;
  connectedAt: Date;
  eventUpdatedAt?: Date;
  eventStatus?: string;
  isStoppedEarning?: boolean;
}

export interface ISongData {
  userId: number;
  songId: number;
  headphoneId: number;
  playTime: number;
  eventStatus?: string;
  startTime?: Date;
}

export interface IRemainEnergy {
  energy: number;
  battery: number;
}
