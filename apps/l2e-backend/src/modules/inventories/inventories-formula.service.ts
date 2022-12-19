import { ChronoUnit, LocalDateTime } from '@js-joda/core';
import {
  Attribute,
  AvailableMintCountData,
  DockInfo,
  DockOpenAndInsertData as DockOpenData,
  HeadphoneBoxDockAttributeData,
  HeadphoneBoxDockQualityData,
  HeadphoneBoxQualityData,
  HeadphoneDto,
  HeadphoneLevelUpAndChargingData,
  HeadphoneLevelUpCostsAndTimeDto,
  HeadphoneLevelUpStats,
  HeadphoneQualityFromBoxData,
  ItemFromMysteryBox,
  ItemTypeFromMysteryBox,
  MysteryBoxCreateData,
  MysteryBoxOpenData,
  MysteryBoxOpenItemData,
  MysteryBoxQuality,
  Quality,
  RequiredCosts,
  StickerUpgradeData,
  TokenSymbol,
} from '@libs/l2e-queries/dtos';
import {
  BadRequestException,
  forwardRef,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import {
  Headphone,
  HeadphoneBox,
  HeadphoneDock,
  Item,
  Sticker,
  TracksFormula,
} from '@libs/l2e-queries/entities';
import { InjectRepository } from '@nestjs/typeorm';
import { TracksFormulaRepository } from '@libs/l2e-queries/repositories';
import { InventoriesUtilService } from './inventories-util.service';
import {
  convertNumberWithDecimalCeil,
  convertNumberWithDecimalFloor,
} from '@libs/l2e-utils/util-functions';

@Injectable()
export class InventoriesFormulaService {
  constructor(
    @Inject('FORMULA_DATA')
    private readonly formulaData: Array<TracksFormula>,
    @Inject(Logger)
    private readonly logger: Logger,
    @Inject(forwardRef(() => InventoriesUtilService))
    private readonly inventoriesUtilService: InventoriesUtilService,
    @InjectRepository(TracksFormula)
    private readonly tracksFormulaRepository: TracksFormulaRepository
  ) {
    this.initializeFormulaTable();
  }

  private _headphoneLevelAndChargeFormulaMap = new Map<
    Quality,
    Map<number, HeadphoneLevelUpAndChargingData>
  >();

  /**
   * 스티커 레벨 별 정보 Map
   *
   * Map<stickerLevel, StickerUpgradeData>
   */
  private _stickerUpgradeFormulaMap = new Map<number, StickerUpgradeData>();

  /**
   * Dock Open 및 퀄리티 별 추가 스탯 정보
   *
   * Map<Quality, Map<positionNumber, DockOpenData>>
   */
  private _dockOpenFormulaMap = new Map<Quality, Map<number, DockOpenData>>();
  private _mysteryBoxOpenFormulaMap = new Map<
    MysteryBoxQuality,
    MysteryBoxOpenData
  >();
  private _mysteryBoxOpenItemFormulaWalkerAliasMap = new Map<
    MysteryBoxQuality,
    any
  >();
  private _mysteryBoxCreateFormulaWalkerAliasMap = new Map<number, any>();
  private _mysteryBoxQualityValueMaxArray = new Array<number>();
  private _availableMintCountWalkerAliasMap = new Map<Quality, any>();
  private _headphoneMintingWeightsByQuality = new Map<Quality, number>();
  private _headphoneMintingWeightsByMintCount = new Map<number, number>();
  private _headphoneMintDynamicValue: number;
  private _headphoneQualityFromBoxFormulaWalkerAliasMap = new Map<
    Quality,
    any
  >();
  private _headphoneBoxQualityWalkerAliasMap = new Map<
    Quality,
    Map<Quality, any>
  >();
  private _headphoneBoxDockQualityWalkerAliasMap = new Map<Quality, any>();

  // TODO: 헤드폰 박스 오픈시 dock attribute 확률이 필요 없으면 삭제 필요
  // private _headphoneBoxDockAttributeWalkerAliasMap = new Map<
  //   Attribute,
  //   Map<Attribute, any>
  // >();

  private attributeList = [
    Attribute.COMFORT,
    Attribute.EFFICIENCY,
    Attribute.LUCK,
    Attribute.RESILIENCE,
  ];

  initializeFormulaTable() {
    try {
      // quality 별 map key 설정(headphone 레벨/충전, 민트 확률, dock 비용)
      const qualityList = [
        Quality.COMMON,
        Quality.UNCOMMON,
        Quality.RARE,
        Quality.EPIC,
        Quality.LEGENDARY,
      ];

      qualityList.forEach(async (quality) => {
        // initialize headphone level up and charging formula map
        const headphoneLevelAndChargeFormulaInnerMap =
          this.makeHeadphoneFormulaInnerMap(quality);

        this._headphoneLevelAndChargeFormulaMap.set(
          quality,
          headphoneLevelAndChargeFormulaInnerMap
        );

        // initialize headphone box quality walker's alias map
        const headphoneBoxQualityInnerWalkerAliasMap =
          this.makeHeadphoneBoxQualityInnerWalkerAliasMap(quality);

        this._headphoneBoxQualityWalkerAliasMap.set(
          quality,
          headphoneBoxQualityInnerWalkerAliasMap
        );

        // initialize dock open and insert formula map
        const makeDockOpenFormulaInnerMap =
          this.makeDockOpenFormulaInnerMap(quality);

        this._dockOpenFormulaMap.set(quality, makeDockOpenFormulaInnerMap);
      });

      /* TODO: 헤드폰 박스 오픈시 dock attribute 확률이 필요 없으면 삭제 필요
      // Attribute 별 map key 설정 (박스 오픈 시 생성되는 dock attribute 속성)

      attributeList.forEach(async (attribute) => {
        const headphoneBoxDockAttributeInnerWalkerAliasMap =
          this.makeHeadphoneBoxDockAttributeInnerWalkerAliasMap(attribute);

        this._headphoneBoxDockAttributeWalkerAliasMap.set(
          attribute,
          headphoneBoxDockAttributeInnerWalkerAliasMap
        );
      });
      */

      // initialize sticker upgrade and stat formula map
      this.makeStickerUpgradeFormulaMap();

      // initialize headphone's available mint count walker's alias map
      this.makeAvailableMintCountWalkerAliasMap();

      // initialize headphone minting parameter maps
      this.makeHeadphoneMintingParameterMaps();

      // initialize _headphoneMintDynamicValue
      this._headphoneMintDynamicValue = 1;

      // initialize headphone quality from box walker's alias map
      this.makeHeadphoneQualityFromBoxWalkerAliasMap();

      // initialize headphone box dock quality walker's alias map
      this.makeHeadphoneBoxDockQualityWalkerAliasMap();

      // initialize mystery box open formula map
      this.makeMysteryBoxOpenFormulaMap();

      // initialize mystery box open item walker's alias map
      this.makeMysteryBoxOpenItemWalkerAliasMap();

      // initialize mystery box create walker's alias map
      this.makeMysteryBoxCreateWalkerAliasMap();
    } catch (error) {
      this.logger.error(
        error,
        'InventoriesFormulaService.initializeFormulaTable()',
        'InventoriesFormulaService'
      );
      // TODO: 프로그램 실행 시, formula가 초기화가 안될 경우에는 정상 동작을 기대할 수 없으므로 아예 프로그램을 종료 시킴. 다른 방법 고민 필요
      // process.exit(1);
    }
  }

  getDurabilityAdjustmentFactor(battery: number) {
    if (battery < 0 || battery >= 100) {
      throw new BadRequestException('Battery must be between 0 and 100');
    }
    if (battery < 50 && battery > 20) {
      return 0.9;
    }
    if (battery <= 20) {
      return 0.1;
    }
    return 1;
  }

  calculateLevelUpCostAndTime(
    level: number,
    headphoneQuality: Quality
  ): HeadphoneLevelUpCostsAndTimeDto {
    // 현재 헤드폰 레벨/quality 인풋으로 받고, 다음 레벨로 업그레이드 시 필요한 cost와 시간을 가져온다
    const result = new HeadphoneLevelUpCostsAndTimeDto();
    const levelUpRequiredMinutes = this._headphoneLevelAndChargeFormulaMap
      .get(headphoneQuality)
      .get(level).levelUpRequiredMinutes;
    result.levelUpCompletionTime = LocalDateTime.now().plusMinutes(
      levelUpRequiredMinutes
    );

    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: this._headphoneLevelAndChargeFormulaMap
          .get(headphoneQuality)
          .get(level).levelUpCostBlb,
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost: this._headphoneLevelAndChargeFormulaMap
          .get(headphoneQuality)
          .get(level).levelUpCostLbl,
      },
    ];

    return result;
  }

  calculateBoostLevelUpCosts(
    level: number,
    headphoneQuality: Quality,
    levelUpCompletionTime: LocalDateTime
  ): RequiredCosts {
    const result = new RequiredCosts();

    // level up boosting 비용 계산
    // 남은 시간 대비 필요한 costs 계산
    const levelUpRequiredMinutes = this._headphoneLevelAndChargeFormulaMap
      .get(headphoneQuality)
      .get(level).levelUpRequiredMinutes;

    const remainedMinutes = LocalDateTime.now().until(
      levelUpCompletionTime,
      ChronoUnit.MINUTES
    );

    const requiredCostBlb =
      (remainedMinutes / levelUpRequiredMinutes) *
      this._headphoneLevelAndChargeFormulaMap.get(headphoneQuality).get(level)
        .levelUpCostBlb;
    const requiredCostLbl =
      (remainedMinutes / levelUpRequiredMinutes) *
      this._headphoneLevelAndChargeFormulaMap.get(headphoneQuality).get(level)
        .levelUpCostLbl;

    // BLB, LBL 소수점 2자리까지 허용
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: convertNumberWithDecimalCeil(requiredCostBlb, 2),
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost: convertNumberWithDecimalCeil(requiredCostLbl, 2),
      },
    ];

    return result;
  }

  calculateLevelUpStats(headphoneQuality: Quality): HeadphoneLevelUpStats {
    // 퀄리티 별로 추가되는 스탯 계산
    const result = new HeadphoneLevelUpStats();
    switch (headphoneQuality) {
      case Quality.COMMON:
        result.levelUpStatCount = Number(
          process.env.COMMON_HEADPHONE_LEVEL_UP_STATS
        );
        break;
      case Quality.UNCOMMON:
        result.levelUpStatCount = Number(
          process.env.UNCOMMON_HEADPHONE_LEVEL_UP_STATS
        );
        break;
      case Quality.RARE:
        result.levelUpStatCount = Number(
          process.env.RARE_HEADPHONE_LEVEL_UP_STATS
        );
        break;
      case Quality.EPIC:
        result.levelUpStatCount = Number(
          process.env.EPIC_HEADPHONE_LEVEL_UP_STATS
        );
        break;
      case Quality.LEGENDARY:
        result.levelUpStatCount = Number(
          process.env.LEGENDARY_HEADPHONE_LEVEL_UP_STATS
        );
        break;
      default:
        throw new BadRequestException('Invalid headphone quality');
    }

    return result;
  }

  calculateChargingCosts(
    chargingAmount: number,
    headphoneQuality: Quality,
    headphoneLevel: number
  ): RequiredCosts {
    // chargingAmount / quality 별로 추가되는 충전 cost 계산
    // 풀 충전 기준으로, 비율에 맞춰서 달라 짐 함. FE랑 같은 공식 사용
    const result = new RequiredCosts();

    const fullChargingCostBlb = this._headphoneLevelAndChargeFormulaMap
      .get(headphoneQuality)
      .get(headphoneLevel).chargingCostBlb;

    const fullChargingCostLbl = this._headphoneLevelAndChargeFormulaMap
      .get(headphoneQuality)
      .get(headphoneLevel).chargingCostLbl;

    const chargingCostBlb = (chargingAmount / 100) * fullChargingCostBlb;
    const chargingCostLbl = (chargingAmount / 100) * fullChargingCostLbl;

    // BLB, LBL 소수점 2자리까지 허용
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: convertNumberWithDecimalCeil(chargingCostBlb, 2),
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost: convertNumberWithDecimalCeil(chargingCostLbl, 2),
      },
    ];

    return result;
  }

  /**
   *
   * @description: headphone level에 따른 daily token earning limit 계산
   * @param headphoneQuality : 현재는 Quality 별 차이가 없음
   * @param headphoneLevel
   * @returns
   */
  calculateDailyTokenEarningLimit(
    headphoneQuality: Quality,
    headphoneLevel: number
  ): number {
    return this._headphoneLevelAndChargeFormulaMap
      .get(headphoneQuality)
      .get(headphoneLevel).dailyTokenEarningLimit;
  }

  GenerateNewHeadphoneBoxByMinting(
    headphone1: Headphone,
    headphone2: Headphone
  ): HeadphoneBox {
    // 헤드폰 퀄리티에 따른 headphone box 생성
    const result = new HeadphoneBox();

    const [quality1, quality2] = this.inventoriesUtilService.sortQuality([
      headphone1.quality,
      headphone2.quality,
    ]);

    const newHeadphoneBoxQuality = this._headphoneBoxQualityWalkerAliasMap
      .get(quality1)
      .get(quality2)();

    switch (newHeadphoneBoxQuality) {
      case 'commonHeadphoneBox':
        result.quality = Quality.COMMON;
        break;
      case 'uncommonHeadphoneBox':
        result.quality = Quality.UNCOMMON;
        break;
      case 'rareHeadphoneBox':
        result.quality = Quality.RARE;
        break;
      case 'epicHeadphoneBox':
        result.quality = Quality.EPIC;
        break;
      case 'legendaryHeadphoneBox':
        result.quality = Quality.LEGENDARY;
        break;
      default:
        throw new BadRequestException('Invalid headphone quality');
    }

    result.parentId1 = (headphone1.item as Item).id;
    result.parentId2 = (headphone2.item as Item).id;

    return result;
  }

  calculateMintingCosts(
    headphone1: Headphone,
    headphone2: Headphone
  ): RequiredCosts {
    const mintValue =
      this._headphoneMintingWeightsByQuality.get(headphone1.quality) *
      this._headphoneMintingWeightsByQuality.get(headphone2.quality) *
      this._headphoneMintingWeightsByMintCount.get(headphone1.mintCount) *
      this._headphoneMintingWeightsByMintCount.get(headphone2.mintCount);

    const mintCostBlb =
      (Math.log(mintValue) / Math.log(Number(process.env.MINT_SYSTEM_VALUE))) *
      this._headphoneMintDynamicValue;

    const mintCostLbl =
      mintCostBlb * Number(process.env.MINT_COST_LBL_BLB_RATIO);

    const result = new RequiredCosts();
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: Math.floor(mintCostBlb),
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost: Math.floor(mintCostLbl),
      },
    ];

    return result;
  }

  /**
   * @deprecated
   */
  calculateHeadphoneBoxBoostOpenCost(
    quality: Quality
    // openingTime: LocalDateTime
  ): RequiredCosts {
    // headphoneBox boost open 시 필요한 costs 계산
    const result = new RequiredCosts();
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: 10,
      },
    ];

    return result;
  }

  calculateOpenDockCosts(
    dockPosition: number,
    quality: Quality
  ): RequiredCosts {
    // headphone dock open 시 필요한 costs 계산
    const result = new RequiredCosts();

    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: this._dockOpenFormulaMap.get(quality).get(dockPosition)
          .openCostBlb,
      },
    ];

    return result;
  }

  calculateEnhanceStickersCost(stickerLevel: number): RequiredCosts {
    // 스티커 강화 시 필요한 costs 계산
    const result = new RequiredCosts();
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost:
          this._stickerUpgradeFormulaMap.get(stickerLevel).levelUpCostBlb,
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost:
          this._stickerUpgradeFormulaMap.get(stickerLevel).levelUpCostLbl,
      },
    ];

    return result;
  }

  /**
   * @deprecated
   */
  calculateInsertStickerCost(
    headphoneQuality: Quality,
    headphoneLevel: number,
    stickerLevel: number,
    dockQuality: Quality
  ): RequiredCosts {
    // sticker insert 시 필요한 costs 계산
    const result = new RequiredCosts();
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: 10,
      },
    ];

    return result;
  }

  /**
   * 스티커 insert 시 increasing 스탯 계산
   *
   * sticker level | plus attribute |    special effect |
   *             1 |              2 |    +5% base attr. |
   *             2 |              8 |   +70% base attr. |
   *             3 |             25 |  +220% base attr. |
   *             4 |             72 |  +600% base attr. |
   *             5 |            200 | +1400% base attr. |
   *             6 |            400 | +4300% base attr. |
   *
   * dock quality |     special effect |
   *       COMMON |                  - |
   *     UNCOMMON | +10% sticker attr. |
   *         RARE | +20% sticker attr. |
   *         EPIC | +30% sticker attr. |
   *    LEGENDARY | +40% sticker attr. |
   */
  calculateIncreaseStatsInsertSticker(
    originHeadphone: Headphone,
    dockQuality: Quality,
    dockPosition: number,
    stickerLevel: number,
    stickerAttribute: Attribute
  ): Headphone {
    const increasingHeadphoneStats: Headphone = new Headphone();
    switch (stickerAttribute) {
      case Attribute.COMFORT: {
        const baseStat = originHeadphone.baseComfort;
        const increaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        increasingHeadphoneStats.itemComfort =
          convertNumberWithDecimalFloor(originHeadphone.itemComfort, 1) +
          increaseStickerStat;
        increasingHeadphoneStats.comfort =
          convertNumberWithDecimalFloor(originHeadphone.comfort, 1) +
          increaseStickerStat;
        break;
      }
      case Attribute.RESILIENCE: {
        const baseStat = originHeadphone.baseResilience;
        const increaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        increasingHeadphoneStats.itemResilience =
          convertNumberWithDecimalFloor(originHeadphone.itemResilience, 1) +
          increaseStickerStat;
        increasingHeadphoneStats.resilience =
          convertNumberWithDecimalFloor(originHeadphone.resilience, 1) +
          increaseStickerStat;
        break;
      }
      case Attribute.EFFICIENCY: {
        const baseStat = originHeadphone.baseEfficiency;
        const increaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        increasingHeadphoneStats.itemEfficiency =
          convertNumberWithDecimalFloor(originHeadphone.itemEfficiency, 1) +
          increaseStickerStat;
        increasingHeadphoneStats.efficiency =
          convertNumberWithDecimalFloor(originHeadphone.efficiency, 1) +
          increaseStickerStat;
        break;
      }
      case Attribute.LUCK: {
        const baseStat = originHeadphone.baseLuck;
        const increaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        increasingHeadphoneStats.itemLuck =
          convertNumberWithDecimalFloor(originHeadphone.itemLuck, 1) +
          increaseStickerStat;
        increasingHeadphoneStats.luck =
          convertNumberWithDecimalFloor(originHeadphone.luck, 1) +
          increaseStickerStat;
        break;
      }
      default:
        throw new BadRequestException(
          `Invalid sticker attribute: ${stickerAttribute}`
        );
    }

    return increasingHeadphoneStats;
  }

  /**
   * 스티커 remove 시 decreasing 스탯 계산
   */
  calculateDecreaseStatsRemoveSticker(
    originHeadphone: Headphone,
    dockQuality: Quality,
    dockPosition: number,
    stickerLevel: number,
    stickerAttribute: Attribute
  ) {
    const decreasingHeadphoneStats: Headphone = new Headphone();
    switch (stickerAttribute) {
      case Attribute.COMFORT: {
        const baseStat = originHeadphone.baseComfort;
        const decreaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        decreasingHeadphoneStats.itemComfort =
          convertNumberWithDecimalFloor(originHeadphone.itemComfort, 1) -
          decreaseStickerStat;
        decreasingHeadphoneStats.comfort =
          convertNumberWithDecimalFloor(originHeadphone.comfort, 1) -
          decreaseStickerStat;
        break;
      }
      case Attribute.RESILIENCE: {
        const baseStat = originHeadphone.baseResilience;
        const decreaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        decreasingHeadphoneStats.itemResilience =
          convertNumberWithDecimalFloor(originHeadphone.itemResilience, 1) -
          decreaseStickerStat;
        decreasingHeadphoneStats.resilience =
          convertNumberWithDecimalFloor(originHeadphone.resilience, 1) -
          decreaseStickerStat;
        break;
      }
      case Attribute.EFFICIENCY: {
        const baseStat = originHeadphone.baseEfficiency;
        const decreaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        decreasingHeadphoneStats.itemEfficiency =
          convertNumberWithDecimalFloor(originHeadphone.itemEfficiency, 1) -
          decreaseStickerStat;
        decreasingHeadphoneStats.efficiency =
          convertNumberWithDecimalFloor(originHeadphone.efficiency, 1) -
          decreaseStickerStat;
        break;
      }
      case Attribute.LUCK: {
        const baseStat = originHeadphone.baseLuck;
        const decreaseStickerStat = this.calculateStatBySticker(
          baseStat,
          stickerLevel,
          dockQuality,
          dockPosition
        );
        decreasingHeadphoneStats.itemLuck =
          convertNumberWithDecimalFloor(originHeadphone.itemLuck, 1) -
          decreaseStickerStat;
        decreasingHeadphoneStats.luck =
          convertNumberWithDecimalFloor(originHeadphone.luck, 1) -
          decreaseStickerStat;
        break;
      }
      default:
        throw new BadRequestException(
          `Invalid sticker attribute: ${stickerAttribute}`
        );
    }

    return decreasingHeadphoneStats;
  }

  /**
   * 스티커 부착 시 increasing 스탯 계산 w.dock
   */
  private calculateStatBySticker(
    baseStat: number,
    stickerLevel: number,
    dockQuality: Quality,
    dockPosition: number
  ): number {
    /**
     * base attr + parseFloat(parseFloat(base * sticker special attr)) * (1 + dock attr)
     */

    const increaseStatByStickerTmp =
      this._stickerUpgradeFormulaMap.get(stickerLevel).additionalStatPoint +
      convertNumberWithDecimalFloor(baseStat, 1) *
        this._stickerUpgradeFormulaMap.get(stickerLevel).percentToBaseAttribute;

    // 소수점 둘째 자리에서 내림
    const increaseStatBySticker = convertNumberWithDecimalFloor(
      increaseStatByStickerTmp,
      1
    );

    const increaseStatByStickerAndDockTmp =
      increaseStatBySticker *
      (1 +
        this._dockOpenFormulaMap.get(dockQuality).get(dockPosition)
          .percentToAdditionalAttribute);

    // 소수점 둘째 자리에서 내림
    const increaseStatByStickerAndDock = convertNumberWithDecimalFloor(
      increaseStatByStickerAndDockTmp,
      1
    );

    return increaseStatByStickerAndDock;
  }

  /**
   * mysterybox open 시 필요한 costs 계산
   */
  calculateOpenMysteryBoxCosts(
    mysteryBoxQuality: MysteryBoxQuality
  ): RequiredCosts {
    const result = new RequiredCosts();
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost:
          this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).openCostBlb,
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost:
          this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).openCostLbl,
      },
    ];

    return result;
  }

  calculateBoostOpenMysteryBoxCosts(
    mysteryBoxQuality: MysteryBoxQuality,
    openingTimeCountdown: LocalDateTime
  ): RequiredCosts {
    // mysterybox open boosting 시 필요한 costs 계산
    const result = new RequiredCosts();

    // 남은 시간 대비 필요한 costs 계산
    const openingRequiredMinutes =
      this._mysteryBoxOpenFormulaMap.get(
        mysteryBoxQuality
      ).openingRequiredMinutes;

    const remainedMinutes = LocalDateTime.now().until(
      openingTimeCountdown,
      ChronoUnit.MINUTES
    );

    const requiredCostBlb =
      (remainedMinutes / openingRequiredMinutes) *
        this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).boostingCostBlb +
      this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).openCostBlb;

    const requiredCostLbl =
      (remainedMinutes / openingRequiredMinutes) *
        this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).boostingCostLbl +
      this._mysteryBoxOpenFormulaMap.get(mysteryBoxQuality).openCostLbl;

    // 소수점 개수 제한 적용 (BLB, LBL 소수점 2자리까지 허용)
    result.costs = [
      {
        tokenSymbol: TokenSymbol.BLB,
        requiredCost: convertNumberWithDecimalCeil(requiredCostBlb, 2),
      },
      {
        tokenSymbol: TokenSymbol.LBL,
        requiredCost: convertNumberWithDecimalCeil(requiredCostLbl, 2),
      },
    ];

    return result;
  }

  /**
   *
   * quality value max 기준으로 hashmap에서 뽑기 함수 수행 함
   * mysteryBoxQualityValue 값보다 작은 값을 찾아서 해당 퀄리티를 반환
   */

  getMysteryBoxQuality(mysteryBoxQualityValue: number): MysteryBoxQuality {
    // this._mysteryBoxQualityValueMaxArray 최초 1회 초기화
    if (this._mysteryBoxQualityValueMaxArray.length === 0) {
      this._mysteryBoxQualityValueMaxArray = Array.from(
        this._mysteryBoxCreateFormulaWalkerAliasMap.keys()
      ).sort((a, b) => a - b);
    }

    const qualityValueMax = this._mysteryBoxQualityValueMaxArray.find(
      (qualityValueMax) => mysteryBoxQualityValue <= qualityValueMax
    );

    const createdMysteryBoxQuality: MysteryBoxQuality =
      this._mysteryBoxCreateFormulaWalkerAliasMap.get(qualityValueMax)();

    return createdMysteryBoxQuality;
  }

  getMysteryBoxOpeningTime(
    mysteryBoxQuality: MysteryBoxQuality
  ): LocalDateTime {
    const openingRequiredMinutes =
      this._mysteryBoxOpenFormulaMap.get(
        mysteryBoxQuality
      ).openingRequiredMinutes;

    return LocalDateTime.now().plusMinutes(openingRequiredMinutes);
  }

  getItemFromMysteryBox(
    mysteryBoxQuality: MysteryBoxQuality
  ): ItemFromMysteryBox {
    // MysteryBox Open 시 생성되는 아이템 계산
    const newItemFromMysteryBox: ItemFromMysteryBox = new ItemFromMysteryBox();

    // headphoneBox 생성용 내부 함수
    const newHeadphoneBox = function (
      type: ItemTypeFromMysteryBox,
      headphoneBoxQuality: Quality
    ): ItemFromMysteryBox {
      const newHeadphoneBox = new HeadphoneBox();
      newHeadphoneBox.quality = headphoneBoxQuality;

      newItemFromMysteryBox.type = type;
      newItemFromMysteryBox.item = newHeadphoneBox;

      return newItemFromMysteryBox;
    };

    // sticker 생성용 내부 함수
    const newSticker = function (
      type: ItemTypeFromMysteryBox,
      stickerLevel: number
    ): ItemFromMysteryBox {
      const attributeArray = [
        Attribute.COMFORT,
        Attribute.RESILIENCE,
        Attribute.EFFICIENCY,
        Attribute.LUCK,
      ];
      const newSticker = new Sticker();
      newSticker.level = stickerLevel;
      newSticker.attribute =
        attributeArray[Math.floor(Math.random() * attributeArray.length)];

      newItemFromMysteryBox.type = type;
      newItemFromMysteryBox.item = newSticker;

      return newItemFromMysteryBox;
    };

    // blb 생성용 내부 함수
    const newBlb = function (type: ItemTypeFromMysteryBox): ItemFromMysteryBox {
      const minBlb = Number(
        process.env[`MIN_BLB_FROM_${mysteryBoxQuality}_MYSTERYBOX`]
      );
      const maxBlb = Number(
        process.env[`MAX_BLB_FROM_${mysteryBoxQuality}_MYSTERYBOX`]
      );

      // min, max 값 중 생성, min/max 값 포함, 소수점 2자리까지
      const blbAmountTmp = Math.random() * (maxBlb - minBlb) + minBlb;
      const blbAmount = convertNumberWithDecimalFloor(blbAmountTmp, 2);

      newItemFromMysteryBox.type = type;
      newItemFromMysteryBox.item = blbAmount;

      return newItemFromMysteryBox;
    };

    const ItemNameFromMysteryBox =
      this._mysteryBoxOpenItemFormulaWalkerAliasMap.get(mysteryBoxQuality)();

    switch (ItemNameFromMysteryBox) {
      case 'commonHeadphoneBox':
        newHeadphoneBox(ItemTypeFromMysteryBox.HEADPHONEBOX, Quality.COMMON);
        break;
      case 'uncommonHeadphoneBox':
        newHeadphoneBox(ItemTypeFromMysteryBox.HEADPHONEBOX, Quality.UNCOMMON);
        break;
      case 'rareHeadphoneBox':
        newHeadphoneBox(ItemTypeFromMysteryBox.HEADPHONEBOX, Quality.RARE);
        break;
      case 'epicHeadphoneBox':
        newHeadphoneBox(ItemTypeFromMysteryBox.HEADPHONEBOX, Quality.EPIC);
        break;
      case 'legendaryHeadphoneBox':
        newHeadphoneBox(ItemTypeFromMysteryBox.HEADPHONEBOX, Quality.LEGENDARY);
        break;
      case 'lvl1Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 1);
        break;
      case 'lvl2Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 2);
        break;
      case 'lvl3Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 3);
        break;
      case 'lvl4Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 4);
        break;
      case 'lvl5Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 5);
        break;
      case 'lvl6Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 6);
        break;
      case 'lvl7Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 7);
        break;
      case 'lvl8Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 8);
        break;
      case 'lvl9Sticker':
        newSticker(ItemTypeFromMysteryBox.STICKER, 9);
        break;
      case 'blb':
        newBlb(ItemTypeFromMysteryBox.BLB);
        break;
      default:
        this.logger.error(ItemNameFromMysteryBox);
        throw new Error('Invalid ItemNameFromMysteryBox');
    }

    return newItemFromMysteryBox;
  }

  getStickerFromEnhance(
    stickerLevel: number,
    stickerAttribute: Attribute
  ): Sticker {
    // 스티커 강화 시 생성되는 스티커 계산
    // 스티커 강화 성공 확률 계산
    const isSuccess =
      Math.random() <=
      this._stickerUpgradeFormulaMap.get(stickerLevel).successRate;

    let newSticker: Sticker = new Sticker();
    if (isSuccess) {
      newSticker.level = stickerLevel + 1;
      newSticker.attribute = stickerAttribute;
    } else {
      newSticker = null;
    }

    return newSticker;
  }

  getHeadphoneFromHeadphoneBox(
    headphoneBoxQuality: Quality,
    parentId1: number | Item,
    parentId2: number | Item
  ): HeadphoneDto {
    // headphoneBox Open 시 생성되는 headphone 계산
    const newHeadphoneQuality =
      this._headphoneQualityFromBoxFormulaWalkerAliasMap.get(
        headphoneBoxQuality
      )();

    let newHeadphoneDto: HeadphoneDto = undefined;

    switch (newHeadphoneQuality) {
      case 'commonHeadphone':
        newHeadphoneDto = this.setHeadphoneStatsAndQuality(Quality.COMMON);
        break;
      case 'uncommonHeadphone':
        newHeadphoneDto = this.setHeadphoneStatsAndQuality(Quality.UNCOMMON);
        break;
      case 'rareHeadphone':
        newHeadphoneDto = this.setHeadphoneStatsAndQuality(Quality.RARE);
        break;
      case 'epicHeadphone':
        newHeadphoneDto = this.setHeadphoneStatsAndQuality(Quality.EPIC);
        break;
      case 'legendaryHeadphone':
        newHeadphoneDto = this.setHeadphoneStatsAndQuality(Quality.LEGENDARY);
        break;
      default:
        throw new Error('Invalid newHeadphoneQuality');
    }

    newHeadphoneDto.parentId1 = parentId1;
    newHeadphoneDto.parentId2 = parentId2;

    return newHeadphoneDto;
  }

  getHeadphoneDocksFromHeadphoneBox(
    createdHeadphoneQuality: Quality
    // headphoneDocks1Parent: HeadphoneDock[],
    // headphoneDocks2Parent: HeadphoneDock[]
  ): Array<DockInfo> {
    const newHeadphoneDockArray: Array<DockInfo> = [];

    for (let i = 0; i < 4; i++) {
      const newHeadphoneDock = new DockInfo();

      // 부모 헤드폰 quality에 따른 headphone Dock quality 생성
      const newHeadphoneDockQuality =
        this._headphoneBoxDockQualityWalkerAliasMap.get(
          createdHeadphoneQuality
        )();

      switch (newHeadphoneDockQuality) {
        case 'commonDockQuality':
          newHeadphoneDock.dockQuality = Quality.COMMON;
          break;
        case 'uncommonDockQuality':
          newHeadphoneDock.dockQuality = Quality.UNCOMMON;
          break;
        case 'rareDockQuality':
          newHeadphoneDock.dockQuality = Quality.RARE;
          break;
        case 'epicDockQuality':
          newHeadphoneDock.dockQuality = Quality.EPIC;
          break;
        case 'legendaryDockQuality':
          newHeadphoneDock.dockQuality = Quality.LEGENDARY;
          break;
        default:
          throw new Error('Invalid newHeadphoneDockQuality');
      }

      /* TODO: Mint 및 headphone parent가 완전히 필요없어지면 삭제 필요
      // 부모 헤드폰 attribute에 따른 headphone Dock attribute 생성
      // const [attribute1, attribute2] =
      //   this.inventoriesUtilService.sortAttribute([
      //     headphoneDocks1Parent[i].attribute,
      //     headphoneDocks2Parent[i].attribute,
      //   ]);
      // const newHeadphoneDockAttribute =
      //   this._headphoneBoxDockAttributeWalkerAliasMap
      //     .get(attribute1)
      //     .get(attribute2)();

      // switch (newHeadphoneDockAttribute) {
      //   case 'efficiency':
      //     newHeadphoneDock.dockAttribute = Attribute.EFFICIENCY;
      //     break;
      //   case 'luck':
      //     newHeadphoneDock.dockAttribute = Attribute.LUCK;
      //     break;
      //   case 'resilience':
      //     newHeadphoneDock.dockAttribute = Attribute.RESILIENCE;
      //     break;
      //   case 'comfort':
      //     newHeadphoneDock.dockAttribute = Attribute.COMFORT;
      //     break;
      //   default:
      //     throw new Error('Invalid newHeadphoneDockAttribute');
      // }
      */

      // attribute 랜덤 생성
      newHeadphoneDock.dockAttribute =
        this.attributeList[
          Math.floor(Math.random() * this.attributeList.length)
        ];

      newHeadphoneDockArray.push(newHeadphoneDock);
    }

    return newHeadphoneDockArray;
  }

  private setHeadphoneStatsAndQuality(
    newHeadphoneQuality: Quality
  ): HeadphoneDto {
    switch (newHeadphoneQuality) {
      case Quality.COMMON:
        return this.newHeadphoneStat(newHeadphoneQuality);
      case Quality.UNCOMMON:
        return this.newHeadphoneStat(newHeadphoneQuality);
      case Quality.RARE:
        return this.newHeadphoneStat(newHeadphoneQuality);
      case Quality.EPIC:
        return this.newHeadphoneStat(newHeadphoneQuality);
      case Quality.LEGENDARY:
        return this.newHeadphoneStat(newHeadphoneQuality);
      default:
        throw new BadRequestException('Invalid headphone quality');
    }
  }

  // 헤드폰 박스의 퀄리티 기반으로 헤드폰 스탯 생성용 함수
  private newHeadphoneStat(quality: Quality) {
    const _newHeadphone = new HeadphoneDto();

    const minStatPoints = Number(
      process.env[`MIN_STAT_POINTS_${quality}_HEADPHONE`]
    );
    const maxStatPoints = Number(
      process.env[`MAX_STAT_POINTS_${quality}_HEADPHONE`]
    );

    // min, max 값 중 생성, min/max 값 포함, 소수점 2자리까지
    const newStatPointsArray = [];
    for (let i = 0; i < 4; i++) {
      const statPointsTmp =
        Math.random() * (maxStatPoints - minStatPoints) + minStatPoints;
      const statPoints = convertNumberWithDecimalFloor(statPointsTmp, 1);

      newStatPointsArray.push(statPoints);
    }

    _newHeadphone.quality = quality;
    _newHeadphone.availableMintCount = this.getAvailableMintCount(quality);

    _newHeadphone.baseComfort = newStatPointsArray[0];
    _newHeadphone.comfort = newStatPointsArray[0];
    _newHeadphone.baseResilience = newStatPointsArray[1];
    _newHeadphone.resilience = newStatPointsArray[1];
    _newHeadphone.baseEfficiency = newStatPointsArray[2];
    _newHeadphone.efficiency = newStatPointsArray[2];
    _newHeadphone.baseLuck = newStatPointsArray[3];
    _newHeadphone.luck = newStatPointsArray[3];

    return _newHeadphone;
  }

  private getAvailableMintCount(quality: Quality): number {
    const availableMintCountStr =
      this._availableMintCountWalkerAliasMap.get(quality)();

    switch (availableMintCountStr) {
      case 'zeroAvailableMint':
        return 0;
      case 'oneAvailableMint':
        return 1;
      case 'twoAvailableMint':
        return 2;
      case 'threeAvailableMint':
        return 3;
      case 'fourAvailableMint':
        return 4;
      case 'fiveAvailableMint':
        return 5;
      case 'sixAvailableMint':
        return 6;
      case 'sevenAvailableMint':
        return 7;
      default:
        throw new Error('Invalid availableMintCountStr');
    }
  }

  private makeAvailableMintCountWalkerAliasMap() {
    const availableMintCountData = this.formulaData.find(
      (formula) =>
        formula.formulaName === 'headphoneAvailableMintCountByQuality'
    );

    availableMintCountData.formulaArray.forEach(
      (json: AvailableMintCountData) => {
        const arrayOfWeightValuePairs = [];

        const keys = Object.keys(json);
        keys.forEach((key) => {
          const value = json[key];
          if (value > 0 && key !== 'headphoneQuality') {
            arrayOfWeightValuePairs.push([value, key]);
          }
        });

        const aliasMapFunc = this.createWalkerAliasMap(arrayOfWeightValuePairs);
        this._availableMintCountWalkerAliasMap.set(
          json.headphoneQuality,
          aliasMapFunc
        );
      }
    );
  }

  private makeHeadphoneFormulaInnerMap(
    quality: Quality
  ): Map<number, HeadphoneLevelUpAndChargingData> {
    const formulaName = `${quality.toLowerCase()}HeadphoneLevelAndCharge`;
    let headphoneLevelAndChargeData;
    try {
      headphoneLevelAndChargeData = this.formulaData.find(
        (formula) => formula.formulaName === formulaName
      );
    } catch (error) {
      this.logger.error(error);
    }

    const headphoneLevelAndChargeFormulaInnerMap = new Map<
      number,
      HeadphoneLevelUpAndChargingData
    >();

    headphoneLevelAndChargeData.formulaArray.forEach(
      (json: HeadphoneLevelUpAndChargingData) => {
        headphoneLevelAndChargeFormulaInnerMap.set(json.level, {
          levelUpCostBlb: json.levelUpCostBlb,
          levelUpCostLbl: json.levelUpCostLbl,
          levelUpRequiredMinutes: json.levelUpRequiredMinutes,
          boostingCostBlb: json.boostingCostBlb,
          boostingCostLbl: json.boostingCostLbl,
          chargingCostBlb: json.chargingCostBlb,
          chargingCostLbl: json.chargingCostLbl,
          dailyTokenEarningLimit: json.dailyTokenEarningLimit,
        });
      }
    );

    return headphoneLevelAndChargeFormulaInnerMap;
  }

  private makeHeadphoneMintingParameterMaps() {
    const headphoneQualityArray = [
      Quality.COMMON,
      Quality.UNCOMMON,
      Quality.RARE,
      Quality.EPIC,
      Quality.LEGENDARY,
    ];
    headphoneQualityArray.forEach((quality) => {
      const parameterName = `${quality}_HEADPHONE_MINT_WEIGHT`;
      this._headphoneMintingWeightsByQuality.set(
        quality,
        Number(process.env[parameterName])
      );
    });

    const headphoneMintCountArray = [
      'ZERO',
      'ONE',
      'TWO',
      'THREE',
      'FOUR',
      'FIVE',
      'SIX',
    ];
    for (let i = 0; i < headphoneMintCountArray.length; i++) {
      const parameterName = `${headphoneMintCountArray[i]}_MINT_COUNT_WEIGHT`;
      this._headphoneMintingWeightsByMintCount.set(
        i,
        Number(process.env[parameterName])
      );
    }
  }

  private makeStickerUpgradeFormulaMap(): void {
    const stickerUpgradeData = this.formulaData.find(
      (formula) => formula.formulaName === 'stickerUpgrade'
    );

    stickerUpgradeData.formulaArray.forEach((json: StickerUpgradeData) => {
      this._stickerUpgradeFormulaMap.set(json.level, {
        requiredNumber: json.requiredNumber,
        levelUpCostBlb: json.levelUpCostBlb,
        levelUpCostLbl: json.levelUpCostLbl,
        successRate: json.successRate,
        additionalStatPoint: json.additionalStatPoint,
        percentToBaseAttribute: json.percentToBaseAttribute,
      });
    });
  }

  private makeDockOpenFormulaInnerMap(
    quality: Quality
  ): Map<number, DockOpenData> {
    const dockOpenData = this.formulaData.find(
      (formula) => formula.formulaName === 'dockOpen'
    );

    const dockOpenFormulaInnerMap = new Map<number, DockOpenData>();

    dockOpenData.formulaArray.forEach((json: DockOpenData) => {
      if ((json.headphoneQuality as Quality) === quality) {
        dockOpenFormulaInnerMap.set(json.position, {
          openCostBlb: json.openCostBlb,
          percentToAdditionalAttribute: json.percentToAdditionalAttribute,
        });
      }
    });

    return dockOpenFormulaInnerMap;
  }

  private makeMysteryBoxOpenFormulaMap() {
    const mysteryBoxOpenData = this.formulaData.find(
      (formula) => formula.formulaName === 'mysteryBoxOpen'
    );

    mysteryBoxOpenData.formulaArray.forEach((json: MysteryBoxOpenData) => {
      this._mysteryBoxOpenFormulaMap.set(json.quality, {
        openCostBlb: json.openCostBlb,
        openCostLbl: json.openCostLbl,
        openingRequiredMinutes: json.openingRequiredMinutes,
        boostingCostBlb: json.boostingCostBlb,
        boostingCostLbl: json.boostingCostLbl,
      });
    });
  }

  private makeMysteryBoxOpenItemWalkerAliasMap() {
    const mysteryBoxOpenItemData = this.formulaData.find(
      (formula) => formula.formulaName === 'mysteryBoxOpenItem'
    );

    mysteryBoxOpenItemData.formulaArray.forEach(
      (json: MysteryBoxOpenItemData) => {
        const arrayOfWeightValuePairs = [];

        const keys = Object.keys(json);
        keys.forEach((key) => {
          const value = json[key];
          if (
            value > 0 &&
            key !== 'quality' &&
            key !== 'blbMin' &&
            key !== 'blbMax'
          ) {
            arrayOfWeightValuePairs.push([value, key]);
          }
        });

        const aliasMapFunc = this.createWalkerAliasMap(arrayOfWeightValuePairs);
        this._mysteryBoxOpenItemFormulaWalkerAliasMap.set(
          json.quality,
          aliasMapFunc
        );
      }
    );
  }

  private makeMysteryBoxCreateWalkerAliasMap() {
    const mysteryBoxCreateData = this.formulaData.find(
      (formula) => formula.formulaName === 'mysteryBoxCreate'
    );

    mysteryBoxCreateData.formulaArray.forEach((json: MysteryBoxCreateData) => {
      const keys = Object.keys(json);
      keys.forEach(async (key) => {
        if (key === 'qualityValueMax') {
          const qualityValueMax = json[key];
          await this.makeMysteryBoxCreateInnerWalkerAliasMap(qualityValueMax);
        }
      });
    });
  }

  private async makeMysteryBoxCreateInnerWalkerAliasMap(
    qualityMaxValue: number
  ): Promise<void> {
    const mysteryBoxCreateData = await this.tracksFormulaRepository.findOne({
      where: {
        formulaName: 'mysteryBoxCreate',
      },
    });

    mysteryBoxCreateData.formulaArray.forEach((json: MysteryBoxCreateData) => {
      if (json.qualityValueMax === qualityMaxValue) {
        const arrayOfWeightValuePairs = [];

        const keys = Object.keys(json);
        keys.forEach((key) => {
          const value = json[key];
          if (
            value > 0 &&
            key !== 'qualityValueMin' &&
            key !== 'qualityValueMax'
          ) {
            arrayOfWeightValuePairs.push([value, key.toUpperCase()]);
          }
        });

        const innerAliasMapFunc = this.createWalkerAliasMap(
          arrayOfWeightValuePairs
        );
        this._mysteryBoxCreateFormulaWalkerAliasMap.set(
          json.qualityValueMax,
          innerAliasMapFunc
        );
      }
    });
  }

  private makeHeadphoneQualityFromBoxWalkerAliasMap() {
    const headphoneQualityFromBoxData = this.formulaData.find(
      (formula) => formula.formulaName === 'headphoneQualityFromBox'
    );

    headphoneQualityFromBoxData.formulaArray.forEach(
      (json: HeadphoneQualityFromBoxData) => {
        const arrayOfWeightValuePairs = [];

        const keys = Object.keys(json);
        keys.forEach((key) => {
          const value = json[key];
          if (
            value > 0 &&
            key !== 'headphoneBoxQuality' &&
            key !== 'statMin' &&
            key !== 'statMax'
          ) {
            arrayOfWeightValuePairs.push([value, key]);
          }
        });

        const aliasMapFunc = this.createWalkerAliasMap(arrayOfWeightValuePairs);
        this._headphoneQualityFromBoxFormulaWalkerAliasMap.set(
          json.headphoneBoxQuality,
          aliasMapFunc
        );
      }
    );
  }

  private makeHeadphoneBoxQualityInnerWalkerAliasMap(
    quality: Quality
  ): Map<Quality, any> {
    const headphoneBoxQualityData = this.formulaData.find(
      (formula) => formula.formulaName === 'headphoneBoxQuality'
    );

    const headphoneBoxQualityInnerWalkerAliasMap = new Map<Quality, any>();

    headphoneBoxQualityData.formulaArray.forEach(
      (json: HeadphoneBoxQualityData) => {
        if (json.headphone1Quality === quality) {
          const arrayOfWeightValuePairs = [];

          const keys = Object.keys(json);
          keys.forEach((key) => {
            const value = json[key];
            if (
              value > 0 &&
              key !== 'headphone1Quality' &&
              key !== 'headphone2Quality'
            ) {
              arrayOfWeightValuePairs.push([value, key]);
            }
          });

          const innerAliasMapFunc = this.createWalkerAliasMap(
            arrayOfWeightValuePairs
          );
          headphoneBoxQualityInnerWalkerAliasMap.set(
            json.headphone2Quality,
            innerAliasMapFunc
          );
        }
      }
    );

    return headphoneBoxQualityInnerWalkerAliasMap;
  }

  private makeHeadphoneBoxDockQualityWalkerAliasMap(): void {
    const headphoneBoxDockQualityData = this.formulaData.find(
      (formula) => formula.formulaName === 'headphoneBoxDockQuality'
    );

    headphoneBoxDockQualityData.formulaArray.forEach(
      (json: HeadphoneBoxDockQualityData) => {
        const arrayOfWeightValuePairs = [];

        const keys = Object.keys(json);
        keys.forEach((key) => {
          const value = json[key];
          if (value > 0 && key !== 'headphoneQuality') {
            arrayOfWeightValuePairs.push([value, key]);
          }
        });

        const innerAliasMapFunc = this.createWalkerAliasMap(
          arrayOfWeightValuePairs
        );
        this._headphoneBoxDockQualityWalkerAliasMap.set(
          json.headphoneQuality,
          innerAliasMapFunc
        );
      }
    );
  }

  /*
   * @deprecated
   */
  private makeHeadphoneBoxDockAttributeInnerWalkerAliasMap(
    attribute: Attribute
  ): Map<Attribute, any> {
    const headphoneBoxDockAttributeData = this.formulaData.find(
      (formula) => formula.formulaName === 'headphoneBoxDockAttribute'
    );

    const headphoneBoxDockQualityInnerWalkerAliasMap = new Map<
      Attribute,
      any
    >();

    headphoneBoxDockAttributeData.formulaArray.forEach(
      (json: HeadphoneBoxDockAttributeData) => {
        if (json.headphone1Attribute === attribute) {
          const arrayOfWeightValuePairs = [];

          const keys = Object.keys(json);
          keys.forEach((key) => {
            const value = json[key];
            if (
              value > 0 &&
              key !== 'headphone1Attribute' &&
              key !== 'headphone2Attribute'
            ) {
              arrayOfWeightValuePairs.push([value, key]);
            }
          });

          const innerAliasMapFunc = this.createWalkerAliasMap(
            arrayOfWeightValuePairs
          );
          headphoneBoxDockQualityInnerWalkerAliasMap.set(
            json.headphone2Attribute,
            innerAliasMapFunc
          );
        }
      }
    );

    return headphoneBoxDockQualityInnerWalkerAliasMap;
  }

  /**
    Walker's alias method for random objects with different probabilities.
    
    Takes an array of weight value pairs and returns a sample function:
    
        // Create table with weights
        const table = this.createWalkerAliasMap([
            [0.1, 'a'],   
            [0.3, 'b'],
            [0.2, 'c'],
            [0.4, 'd']]);
        
        // Table produces a 10% of the time, b 30%, c 20%, and d 40%.
        // Take sample
        table();
  */
  private createWalkerAliasMap(weightMap) {
    const n = weightMap.length;
    const sum = weightMap.reduce((p, c, i) => {
      if (c[0] <= 0)
        throw {
          name: 'WeightError',
          message: `Invalid weight ${c[0]} at index ${i}. Weight cannot be negative or zero.`,
        };
      return p + c[0];
    }, 0);
    const weights = weightMap.map((x) => (x[0] * n) / sum);

    const shorts = [];
    const longs = [];
    for (let i = 0, len = weights.length; i < len; ++i) {
      const p = weights[i];
      if (p < 1) {
        shorts.push(i);
      } else if (p > 1) {
        longs.push(i);
      }
    }

    const inx = Array.from(Array(n)).map((_) => -1);
    while (shorts.length && longs.length) {
      const j = shorts.pop();
      const k = longs[longs.length - 1];
      inx[j] = k;
      weights[k] -= 1 - weights[j];
      if (weights[k] < 1) {
        shorts.push(k);
        longs.pop();
      }
    }

    return () => {
      const r = Math.random;
      const u = r();
      const j = this.randomInt(0, n, r);
      const k = u <= weights[j] ? j : inx[j];
      return weightMap[k][1];
    };
  }
  private randomInt(min, max, r) {
    return Math.floor(r() * (max - min)) + min;
  }
}
