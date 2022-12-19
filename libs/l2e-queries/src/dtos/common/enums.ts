export enum Quality {
  UNKNOWN = 'UNKNOWN',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
}

export enum MysteryBoxQuality {
  DAMAGED = 'DAMAGED',
  REFURBISHED = 'REFURBISHED',
  COMMON = 'COMMON',
  UNCOMMON = 'UNCOMMON',
  RARE = 'RARE',
  EPIC = 'EPIC',
  LEGENDARY = 'LEGENDARY',
  ENCHANTED = 'ENCHANTED',
  MASTER = 'MASTER',
  SATOSHI = 'SATOSHI',
}

export enum Attribute {
  EFFICIENCY = 'EFFICIENCY',
  LUCK = 'LUCK',
  RESILIENCE = 'RESILIENCE',
  COMFORT = 'COMFORT',
}

export enum ItemStatus {
  COOLDOWN = 'COOLDOWN', // headphone 상태
  IDLE = 'IDLE', // headphone 상태
  INSERTED = 'INSERTED', // sticker 상태
  NOT_INSERTED = 'NOT_INSERTED', // sticker 상태
  LISTENING = 'LISTENING', // headphone 상태
  SELLING = 'SELLING', // headphone, headphone box, sticker, pinballhead 상태
  LEVELING = 'LEVELING', // headphone 상태
  NOT_OPENED = 'NOT_OPENED', // headphone box, mysterybox 상태
  OPENED = 'OPENED', // headphone box, mysterybox 상태
  BURNED = 'BURNED', // headphone, sticker 상태
  WITHDRAWN = 'WITHDRAWN', // headphone, headphone box, pinballhead 상태
}

export enum ItemType {
  PINBALLHEAD = 'PINBALLHEAD',
  HEADPHONE = 'HEADPHONE',
  HEADPHONEBOX = 'HEADPHONEBOX',
  STICKER = 'STICKER',
  MYSTERYBOX = 'MYSTERYBOX',
  TICKET = 'TICKET',
  MERCHANDISE = 'MERCHANDISE',
}

export enum ItemTypeFilter {
  HEADPHONE = 'HEADPHONE',
  HEADPHONEBOX = 'HEADPHONEBOX',
}

export enum ItemTypeFromMysteryBox {
  HEADPHONEBOX = 'HEADPHONEBOX',
  STICKER = 'STICKER',
  BLB = 'BLB',
  LBL = 'LBL',
}

export enum DockStatus {
  NOT_OPENED = 'NOT_OPENED',
  OPENED = 'OPENED',
  INSERTED = 'INSERTED',
}

export enum TradeType {
  LISTING = 'LISTING', //listing
  UPDATE = 'UPDATE', //update
  REVOKE = 'REVOKE', //revoke
  SOLD = 'SOLD', //sold'
}
export enum MainNetNetwork {
  BSC = 'BSC',
}

export enum BalanceCheckPurpose {
  LEVELUP = 'LEVELUP',
  MINT = 'MINT',
  BOOST = 'BOOST',
  SELL = 'SELL',
  ENHANCE = 'ENHANCE',
  CHARGING = 'CHARGING',
  DOCK_OPEN = 'DOCK_OPEN',
  MYSTERYBOX_OPEN = 'MYSTERYBOX_OPEN',
  INSERT_STICKER = 'INSERT_STICKER',
}

export enum SongStatus {
  NOT_UPLOAD = 'NOT_UPLOAD', //업로드 취소한 상태
  UPLOAD = 'UPLOAD', // s3 업로드 상태
}

export enum TokenSymbol {
  BNB = 'BNB',
  LBL = 'LBL',
  BLB = 'BLB',
}

export enum Display {
  SHOW = 'SHOW', //보여주는상태
  NOTSHOW = 'NOT_SHOW', //안보여주는상태
}

export enum StatusListenHistory {
  LISTEN = 'LISTEN',
  REWARD = 'REWARD',
}
export enum WithdrawType {
  TOKEN = 'TOKEN',
  NFT = 'NFT',
}

export enum WithdrawStatus {
  PENDING = 'PENDING',
  MINT_PROCESSING = 'MINT_PROCESSING',
  TRANSFER_PROCESSING = 'TRANSFER_PROCESSING',
  SUCCESS = 'SUCCESS',
  MINT_FAILED = 'MINT_FAILED',
  TRANSFER_FAILED = 'TRANSFER_FAILED',
}
