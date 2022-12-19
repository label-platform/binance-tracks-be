import {
  Controller,
  Get,
  Post,
  Body,
  Delete,
  Query,
  HttpCode,
  Put,
  UseGuards,
} from '@nestjs/common';
import {
  Attribute,
  BoostLevelUpHeadphoneDto,
  ChargeHeadphoneRequestDto,
  CooldownCompleteHeadphoneDto,
  CreateHeadphoneBoxDto,
  CreateHeadphoneDto,
  CreateMysteryBoxDto,
  CreatePinballheadDto,
  CreateStickerDto,
  EnhanceStickerRequestDto,
  InsertStickerRequestDto,
  LevelUpHeadphoneDto,
  MintHeadphoneDto,
  MountHeadphoneDto,
  OpenHeadphoneBoxDto,
  OpenHeadphoneDockDto,
  OpenMysteryBoxDto,
  reduceHeadphoneBatteryDto,
  StatUpHeadphoneDto,
  UpdateHeadphoneBoxDto,
  UpdateHeadphoneDto,
  UpdateMysteryBoxDto,
  UpdatePinballheadDto,
  UpdateStickerDto,
} from '@libs/l2e-queries/dtos';
import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import {
  HeadphoneBoxesService,
  HeadphonesService,
  MysteryBoxesService,
  PinballheadsService,
  StickersService,
} from './services';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { User } from '@libs/l2e-queries/entities';
import { RolesGuard } from '@src/cores/guards/roles.guard';
import { Roles } from '@src/cores/decorators/role.decorator';
import { ApiKeyAuthGuard } from '@src/cores/guards/api-key-auth.guard';

@Controller('inventories')
export class InventoriesController {
  constructor(
    private readonly headphonesService: HeadphonesService,
    private readonly headphonesBoxesService: HeadphoneBoxesService,
    private readonly stickersService: StickersService,
    private readonly mysteryBoxesService: MysteryBoxesService,
    private readonly pinballheadsService: PinballheadsService
  ) {}

  @Post('/headphones')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createHeadphone(@Body() createHeadphoneDto: CreateHeadphoneDto) {
    const content = await this.headphonesService.createHeadphone(
      createHeadphoneDto
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/headphones/mint')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async mintHeadphone(
    @Body() mintHeadphoneDto: MintHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.mintHeadphone(
      mintHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/headphone-boxes')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createHeadphoneBox(
    @Body() createHeadphoneBoxDto: CreateHeadphoneBoxDto
  ) {
    const content = await this.headphonesBoxesService.createHeadphoneBox(
      createHeadphoneBoxDto
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/headphone-boxes/open')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async openHeadphoneBox(
    @Body() openHeadphoneBoxDto: OpenHeadphoneBoxDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesBoxesService.openHeadphoneBox(
      openHeadphoneBoxDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  /**
   * @deprecated
   */
  // @Post('/headphone-boxes/open/boost')
  // @Roles('listener')
  // @UseGuards(RolesGuard)
  // @UseGuards(JwtAuthGuard)
  // @HttpCode(200)
  // async boostOpenHeadphoneBox(
  //   @Body() openHeadphoneBoxDto: OpenHeadphoneBoxDto,
  //   @UserScope() user: User
  // ) {
  //   const content = await this.headphonesBoxesService.boostOpenHeadphoneBox(
  //     openHeadphoneBoxDto,
  //     user.id
  //   );
  //   return {
  //     success: true,
  //     content,
  //   };
  // }

  @Post('/stickers')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createSticker(@Body() createStickerDto: CreateStickerDto) {
    const content = await this.stickersService.createSticker(createStickerDto);
    return {
      success: true,
      content,
    };
  }

  @Post('/mystery-boxes')
  // @Roles('admin')
  // @UseGuards(RolesGuard)
  @UseGuards(ApiKeyAuthGuard)
  @HttpCode(201)
  async createMysteryBox(@Body() createMysteryBoxDto: CreateMysteryBoxDto) {
    const content = await this.mysteryBoxesService.createMysteryBox(
      createMysteryBoxDto
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/mystery-boxes/open')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async openMysteryBox(
    @Body() openMysteryBoxDto: OpenMysteryBoxDto,
    @UserScope() user: User
  ) {
    const content = await this.mysteryBoxesService.openMysteryBox(
      openMysteryBoxDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/mystery-boxes/open/boost')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(200)
  async boostOpenMysteryBox(
    @Body() openMysteryBoxDto: OpenMysteryBoxDto,
    @UserScope() user: User
  ) {
    const content = await this.mysteryBoxesService.boostOpenMysteryBox(
      openMysteryBoxDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Post('/pinballheads')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  @HttpCode(201)
  async createPinballhead(@Body() createPinballheadDto: CreatePinballheadDto) {
    const content = await this.pinballheadsService.createPinballhead(
      createPinballheadDto
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/list')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async findAllHeadphonesByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const content = await this.headphonesService.retrieveAllHeadphonesByUserId(
      user.id,
      pageOptionsDto
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveHeadphoneDetailItemId(@Query('itemId') itemId: number) {
    const content =
      await this.headphonesService.retrieveHeadphoneDetailByItemId(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/listening')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveListeningHeadphoneDetail(@UserScope() user: User) {
    const content =
      await this.headphonesService.retrieveListeningHeadphoneDetail(user.id);
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/level-up')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedLevelUpCostHeadphone(
    @Query('headphoneId') levelUpHeadphoneId: number,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesService.getCalculatedLevelUpCostHeadphone(
        +levelUpHeadphoneId,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/level-up/boost')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedBoostingLevelUpCostHeadphone(
    @Query('headphoneId') boostLevelUpHeadphoneId: number,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesService.getCalculatedBoostingLevelUpCostHeadphone(
        +boostLevelUpHeadphoneId,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/charge')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedChargingCostHeadphone(
    @Query() chargeHeadphoneRequestDto: ChargeHeadphoneRequestDto,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesService.getCalculatedChargingCostHeadphone(
        chargeHeadphoneRequestDto,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/mint')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedMintingCostHeadphone(
    @Query('headphoneId1') mintHeadphoneId1: number,
    @Query('headphoneId2') mintHeadphoneId2: number,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesService.getCalculatedMintingCostHeadphone(
        +mintHeadphoneId1,
        +mintHeadphoneId2,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphones/dock')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedOpenDockCostHeadphone(
    @Query('headphoneId') openDockHeadphoneId: number,
    @Query('dockPosition') dockPosition: number,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesService.getCalculatedOpenDockCostHeadphone(
        +openDockHeadphoneId,
        +dockPosition,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphone-boxes/list')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveAllHeadphoneBoxByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const content =
      await this.headphonesBoxesService.retrieveAllHeadphoneBoxesByUserId(
        user.id,
        pageOptionsDto
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/headphone-boxes/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveHeadphoneBoxDetailByItemId(@Query('itemId') itemId: number) {
    const content =
      await this.headphonesBoxesService.retrieveHeadphoneBoxDetailByItemId(
        +itemId
      );
    return {
      success: true,
      content,
    };
  }

  /**
   * @deprecated
   */
  @Get('/headphone-boxes/open/boost')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedBoostingHeadphoneBoxOpenCost(
    @Query('itemId') itemId: number,
    @UserScope() user: User
  ) {
    const content =
      await this.headphonesBoxesService.getCalculatedBoostingHeadphoneBoxOpenCost(
        +itemId,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/stickers/list')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async findAllStickersByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const content = await this.stickersService.retrieveAllStickersByUserId(
      user.id,
      pageOptionsDto
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/stickers/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveStickerDetailByItemId(@Query('itemId') itemId: number) {
    const content = await this.stickersService.retrieveStickerDetailByItemId(
      +itemId
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/stickers/list/insert')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveAllStickersByAttribute(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto,
    @Query('attribute') attribute: Attribute
  ) {
    const content = await this.stickersService.retrieveAllStickersByAttribute(
      user.id,
      pageOptionsDto,
      attribute
    );
    return {
      success: true,
      content,
    };
  }

  /**
   * @deprecated
   */
  @Get('/stickers/insert')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedInsertStickerCost(
    @UserScope() user: User,
    @Query() insertStickerRequestDto: InsertStickerRequestDto
  ) {
    const content = await this.stickersService.getCalculatedInsertStickerCost(
      user.id,
      insertStickerRequestDto
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/stickers/enhance')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedEnhanceStickersCost(
    @UserScope() user: User,
    @Query() enhanceStickerRequestDto: EnhanceStickerRequestDto
  ) {
    const content = await this.stickersService.getCalculatedEnhanceStickersCost(
      user.id,
      enhanceStickerRequestDto
    );
    return {
      success: true,
      content,
    };
  }

  @Get('/mystery-boxes/list')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async findAllMysteryBoxesByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const content =
      await this.mysteryBoxesService.retrieveAllMysteryBoxesByUserId(
        user.id,
        pageOptionsDto
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/mystery-boxes/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrieveMysteryBoxDetailByItemId(@Query('itemId') itemId: number) {
    const content =
      await this.mysteryBoxesService.retrieveMysteryBoxDetailByItemId(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Get('/mystery-boxes/open')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedMysteryBoxOpenCost(
    @Query('itemId') itemId: number,
    @UserScope() user: User
  ) {
    const content =
      await this.mysteryBoxesService.getCalculatedMysteryBoxOpenCost(
        +itemId,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/mystery-boxes/open/boost')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async getCalculatedBoostingMysteryBoxOpenCost(
    @Query('itemId') itemId: number,
    @UserScope() user: User
  ) {
    const content =
      await this.mysteryBoxesService.getCalculatedBoostingMysteryBoxOpenCost(
        +itemId,
        user.id
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/pinballheads/list')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async findAllPinballHeadsByUserId(
    @UserScope() user: User,
    @Query() pageOptionsDto: PageOptionsDto
  ) {
    const content =
      await this.pinballheadsService.retrieveAllPinballheadsByUserId(
        user.id,
        pageOptionsDto
      );
    return {
      success: true,
      content,
    };
  }

  @Get('/pinballheads/detail')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async retrievePinballheadDetailByItemId(@Query('itemId') itemId: number) {
    const content =
      await this.pinballheadsService.retrievePinballheadDetailByItemId(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async updateHeadphone(@Body() updateHeadphoneDto: UpdateHeadphoneDto) {
    const content = await this.headphonesService.updateHeadphoneByAdmin(
      updateHeadphoneDto
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/level-up')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async levelUpHeadphone(
    @Body() levelUpHeadphoneBoxDto: LevelUpHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.levelUpHeadphone(
      levelUpHeadphoneBoxDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/level-up/boost')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async boostLevelUpHeadphone(
    @Body() boostLevelUpHeadphoneBoxDto: BoostLevelUpHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.boostLevelUpHeadphone(
      boostLevelUpHeadphoneBoxDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/level-up/complete')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async completeLevelUpHeadphone(
    @Body() levelUpHeadphoneDto: LevelUpHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.completeLevelUpHeadphone(
      levelUpHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/level-up/stat-up')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async statUpHeadphone(
    @Body() statUpHeadphoneDto: StatUpHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.statUpHeadphone(
      statUpHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/cooldown/complete')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async completeCooldownHeadphone(
    @Body() cooldownCompleteHeadphoneDto: CooldownCompleteHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.completeCooldownHeadphone(
      cooldownCompleteHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/charge')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async chargeHeadphone(
    @Body() chargeHeadphoneDto: ChargeHeadphoneRequestDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.chargeHeadphone(
      chargeHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/reduce-battery')
  // @UseGuards(RolesGuard)
  // @UseGuards(JwtAuthGuard)
  @UseGuards(ApiKeyAuthGuard)
  async reduceHeadphoneBattery(
    @Body() reduceHeadphoneDto: reduceHeadphoneBatteryDto
  ) {
    const content = await this.headphonesService.reduceHeadphoneBattery(
      reduceHeadphoneDto,
      reduceHeadphoneDto.userId
    );
    return {
      battery: content.battery,
    };
  }

  @Put('/headphones/mount')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async mountHeadphone(
    @Body() mountHeadphoneDto: MountHeadphoneDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.mountHeadphone(
      mountHeadphoneDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphones/dock/open')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async openHeadphoneDock(
    @Body() openHeadphoneDockDto: OpenHeadphoneDockDto,
    @UserScope() user: User
  ) {
    const content = await this.headphonesService.openHeadphoneDock(
      openHeadphoneDockDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/headphone-boxes')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async updateHeadphoneBox(
    @Body() updateHeadphoneBoxDto: UpdateHeadphoneBoxDto
  ) {
    const content = await this.headphonesBoxesService.updateHeadphoneBox(
      updateHeadphoneBoxDto
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/stickers')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async updateSticker(@Body() updateStickerDto: UpdateStickerDto) {
    const content = await this.stickersService.updateSticker(updateStickerDto);
    return {
      success: true,
      content,
    };
  }

  @Put('/stickers/insert')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async insertSticker(
    @Body() insertStickerRequestDto: InsertStickerRequestDto,
    @UserScope() user: User
  ) {
    const content = await this.stickersService.insertSticker(
      insertStickerRequestDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/stickers/remove')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async removeStickerFromDock(
    @Body() insertStickerRequestDto: InsertStickerRequestDto,
    @UserScope() user: User
  ) {
    const content = await this.stickersService.removeStickerFromDock(
      insertStickerRequestDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/stickers/enhance')
  @Roles('listener')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async enhanceSticker(
    @Body() enhanceStickerRequestDto: EnhanceStickerRequestDto,
    @UserScope() user: User
  ) {
    const content = await this.stickersService.enhanceSticker(
      enhanceStickerRequestDto,
      user.id
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/mystery-boxes')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async updateMysteryBox(@Body() updateMysteryBoxDto: UpdateMysteryBoxDto) {
    const content = await this.mysteryBoxesService.updateMysteryBox(
      updateMysteryBoxDto
    );
    return {
      success: true,
      content,
    };
  }

  @Put('/pinballheads')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async updatePinballhead(@Body() updatePinballheadDto: UpdatePinballheadDto) {
    const content = await this.pinballheadsService.updatePinballhead(
      updatePinballheadDto
    );
    return {
      success: true,
      content,
    };
  }

  @Delete('/headphones')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteHeadphone(@Query('itemId') itemId: number) {
    const content = await this.headphonesService.deleteHeadphone(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Delete('/headphone-boxes')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteHeadphoneBox(@Query('itemId') itemId: number) {
    const content = await this.headphonesBoxesService.deleteHeadphoneBox(
      +itemId
    );
    return {
      success: true,
      content,
    };
  }

  @Delete('/stickers')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteSticker(@Query('itemId') itemId: number) {
    const content = await this.stickersService.deleteSticker(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Delete('/mystery-boxes')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deleteMysteryBox(@Query('itemId') itemId: number) {
    const content = await this.mysteryBoxesService.deleteMysteryBox(+itemId);
    return {
      success: true,
      content,
    };
  }

  @Delete('/pinballheads')
  @Roles('admin')
  @UseGuards(RolesGuard)
  @UseGuards(JwtAuthGuard)
  async deletePinballhead(@Query('itemId') itemId: number) {
    const content = await this.pinballheadsService.deletePinballhead(+itemId);
    return {
      success: true,
      content,
    };
  }
}
