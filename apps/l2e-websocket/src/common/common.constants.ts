export const CONFIG_OPTIONS = 'CONFIG_OPTIONS';
export const ROOM_PLAYER = 'ROOM_PLAYER'; // Room UUID for player, store client id and room id
export const ROOM_DATA = 'ROOM_DATA'; // Room song data
export const VALIDATION_PIPE_OPTIONS = {
  transform: true,
  whitelist: true,
  transformOptions: { enableImplicitConversion: true },
};
export const REDIS_URL = `redis://${process.env.REDIS_HOST}:${process.env.REDIS_PORT}`;
export const PLAY_EVENTS = {
  START: 'start',
  STOP: 'stop',
  PAUSE: 'pause',
  CONTINUE: 'continue',
  SKIP: 'skip',
  REPLAY: 'replay',
  NEXT: 'next',
  PREVIOUS: 'previous',
  STOP_EARNING: 'stop-earning',
  UPDATE_ENERGY: 'update-energy',
};
export const PLAY_EVENT_EMIT = {
  UPDATE_REMAIN_ENERGY: 'update-remaining-energy',
};
