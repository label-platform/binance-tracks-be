import { LocalDateTime } from '@js-joda/core';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
} from 'class-validator';
import { HeadphoneBox, Sticker } from '../entities';
import {
  Attribute,
  ItemTypeFromMysteryBox,
  MysteryBoxQuality,
  Quality,
} from './common';

export class HeadphoneLevelUpAndChargingData {
  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNumber()
  @IsNotEmpty()
  levelUpCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  levelUpCostLbl: number;

  @IsNumber()
  @IsNotEmpty()
  levelUpRequiredMinutes: number;

  @IsNumber()
  @IsNotEmpty()
  boostingCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  boostingCostLbl: number;

  @IsNumber()
  @IsNotEmpty()
  chargingCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  chargingCostLbl: number;

  @IsNumber()
  @IsNotEmpty()
  dailyTokenEarningLimit: number;
}

export class StickerUpgradeData {
  @IsNumber()
  @IsOptional()
  level?: number;

  @IsNumber()
  @IsNotEmpty()
  requiredNumber: number;

  @IsNumber()
  @IsNotEmpty()
  levelUpCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  levelUpCostLbl: number;

  @IsNumber()
  @IsNotEmpty()
  successRate: number;

  @IsNumber()
  @IsNotEmpty()
  additionalStatPoint: number;

  @IsNumber()
  @IsNotEmpty()
  percentToBaseAttribute: number;
}

export class DockOpenAndInsertData {
  @IsNumber()
  @IsOptional()
  headphoneQuality?: Quality;

  @IsNumber()
  @IsOptional()
  position?: number;

  @IsNumber()
  @IsNotEmpty()
  openCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  percentToAdditionalAttribute: number;
}

export class MysteryBoxOpenData {
  @IsNumber()
  @IsOptional()
  quality?: MysteryBoxQuality;

  @IsNumber()
  @IsNotEmpty()
  openCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  openCostLbl: number;

  @IsNumber()
  @IsNotEmpty()
  openingRequiredMinutes: number;

  @IsNumber()
  @IsNotEmpty()
  boostingCostBlb: number;

  @IsNumber()
  @IsNotEmpty()
  boostingCostLbl: number;
}

export class MysteryBoxOpenItemData {
  @IsNumber()
  @IsOptional()
  quality?: MysteryBoxQuality;

  @IsNumber()
  @IsNotEmpty()
  commonHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  uncommonHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  rareHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  epicHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  legendaryHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  lvl1Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl2Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl3Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl4Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl5Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl6Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl7Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl8Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  lvl9Sticker: number;

  @IsNumber()
  @IsNotEmpty()
  blb: number;

  @IsNumber()
  @IsNotEmpty()
  blbMin: number;

  @IsNumber()
  @IsNotEmpty()
  blbMax: number;
}

export class HeadphoneQualityFromBoxData {
  @IsNumber()
  @IsOptional()
  headphoneBoxQuality?: Quality;

  @IsNumber()
  @IsNotEmpty()
  commonHeadphone: number;

  @IsNumber()
  @IsNotEmpty()
  uncommonHeadphone: number;

  @IsNumber()
  @IsNotEmpty()
  rareHeadphone: number;

  @IsNumber()
  @IsNotEmpty()
  epicHeadphone: number;

  @IsNumber()
  @IsNotEmpty()
  legendaryHeadphone: number;

  @IsNumber()
  @IsNotEmpty()
  statMin: number;

  @IsNumber()
  @IsNotEmpty()
  statMax: number;
}

export class HeadphoneBoxQualityData {
  @IsEnum(Quality)
  @IsOptional()
  headphone1Quality?: Quality;

  @IsEnum(Quality)
  @IsOptional()
  headphone2Quality?: Quality;

  @IsNumber()
  @IsNotEmpty()
  commonHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  uncommonHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  rareHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  epicHeadphoneBox: number;

  @IsNumber()
  @IsNotEmpty()
  legendaryHeadphoneBox: number;
}

export class HeadphoneBoxDockQualityData {
  @IsEnum(Quality)
  @IsOptional()
  headphoneQuality?: Quality;

  @IsNumber()
  @IsNotEmpty()
  commonDockQuality: number;

  @IsNumber()
  @IsNotEmpty()
  uncommonDockQuality: number;

  @IsNumber()
  @IsNotEmpty()
  rareDockQuality: number;

  @IsNumber()
  @IsNotEmpty()
  epicDockQuality: number;

  @IsNumber()
  @IsNotEmpty()
  legendaryDockQuality: number;
}

export class HeadphoneBoxDockAttributeData {
  @IsEnum(Attribute)
  @IsOptional()
  headphone1Attribute?: Attribute;

  @IsEnum(Attribute)
  @IsOptional()
  headphone2Attribute?: Attribute;

  @IsNumber()
  @IsNotEmpty()
  efficiency: number;

  @IsNumber()
  @IsNotEmpty()
  luck: number;

  @IsNumber()
  @IsNotEmpty()
  resilience: number;

  @IsNumber()
  @IsNotEmpty()
  comfort: number;
}

export class ItemFromMysteryBox {
  @IsEnum(ItemTypeFromMysteryBox)
  @IsNotEmpty()
  type: ItemTypeFromMysteryBox;

  @IsObject()
  @IsNotEmpty()
  item: HeadphoneBox | Sticker | number;
}

export class DockInfo {
  @IsEnum(Quality)
  @IsNotEmpty()
  dockQuality: Quality;

  @IsEnum(Attribute)
  @IsNotEmpty()
  dockAttribute: Attribute;
}

export class MysteryBoxCreateData {
  @IsNumber()
  @IsNotEmpty()
  qualityValueMin: number;

  @IsNumber()
  @IsNotEmpty()
  qualityValueMax: number;

  @IsNumber()
  @IsNotEmpty()
  damaged: number;

  @IsNumber()
  @IsNotEmpty()
  refurbished: number;

  @IsNumber()
  @IsNotEmpty()
  common: number;

  @IsNumber()
  @IsNotEmpty()
  uncommon: number;

  @IsNumber()
  @IsNotEmpty()
  rare: number;

  @IsNumber()
  @IsNotEmpty()
  epic: number;

  @IsNumber()
  @IsNotEmpty()
  legendary: number;

  @IsNumber()
  @IsNotEmpty()
  enchanted: number;

  @IsNumber()
  @IsNotEmpty()
  master: number;

  @IsNumber()
  @IsNotEmpty()
  satoshi: number;
}

export class AvailableMintCountData {
  @IsEnum(Quality)
  @IsNotEmpty()
  headphoneQuality: Quality;

  @IsNumber()
  @IsNotEmpty()
  zeroAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  oneAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  twoAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  threeAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  fourAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  fiveAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  sixAvailableMint: number;

  @IsNumber()
  @IsNotEmpty()
  sevenAvailableMint: number;
}
