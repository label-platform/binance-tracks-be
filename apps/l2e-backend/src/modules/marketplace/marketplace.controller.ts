import { PageOptionsDto } from '@libs/l2e-pagination/dtos';
import {
  HeadphoneOrHeadphoneBoxFilterDto,
  SellDto,
  StickerFilterDto,
  UpdateSellingItemDto,
} from '@libs/l2e-queries/dtos';
import { User } from '@libs/l2e-queries/entities';
import {
  Body,
  Controller,
  createParamDecorator,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { UserScope } from '@src/cores/decorators/user.decorator';
import { JwtAuthGuard } from '@src/cores/guards/jwt-auth.guard';
import { MarketplaceService } from './marketplace.service';

const StickerFilter = createParamDecorator((data, req) => {
  const result = new StickerFilterDto();
  result.attribute = req.args[0].query?.attribute;
  result.levelLessThen = req.args[0].query?.levelLessThen;
  result.levelMoreThen = req.args[0].query?.levelMoreThen;
  return result;
});

const HeadphoneOrHeadphoneBoxFilter = createParamDecorator((data, req) => {
  const result = new HeadphoneOrHeadphoneBoxFilterDto();
  result.type = req.args[0].query.type;
  result.quality = req.args[0].query?.quality;
  result.mintLessThen = req.args[0].query?.mintLessThen;
  result.mintMoreThen = req.args[0].query?.mintMoreThen;
  result.levelLessThen = req.args[0].query?.levelLessThen;
  result.levelMoreThen = req.args[0].query?.levelMoreThen;
  return result;
});

@Controller('marketplace')
@ApiTags('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Post('sell')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async sell(@Body() sellDto: SellDto, @UserScope() user: User) {
    const sellData = await this.marketplaceService.sell(sellDto, user.id);
    return {
      success: true,
      content: sellData,
    };
  }
  @Post('updateSell/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async updateSell(
    @Body() updateSellingItemDto: UpdateSellingItemDto,
    @Param('id') saleId: number,
    @UserScope() user: User
  ) {
    const updateSell = await this.marketplaceService.updateSell(
      updateSellingItemDto,
      saleId,
      user.id
    );
    return {
      success: true,
      content: updateSell,
    };
  }

  @Post('cancelSell/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async cancelSell(@Param('id') saleId: number, @UserScope() user: User) {
    await this.marketplaceService.cancelSell(saleId, user.id);
    return {
      success: true,
    };
  }

  @Post('buy/:id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async buy(@Param('id') saleId: number, @UserScope() user: User) {
    const buyItem = await this.marketplaceService.buy(saleId, user.id);
    return {
      success: true,
      content: buyItem,
    };
  }

  @Get('list/stickers')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchSellSticker(
    @Query() pageOptionsDto: PageOptionsDto,
    @StickerFilter() stickerFilterDto: StickerFilterDto,
    @UserScope() user: User
  ) {
    const data = await this.marketplaceService.fetchSellSticker(
      pageOptionsDto,
      stickerFilterDto,
      user
    );
    return {
      success: true,
      content: data,
    };
  }
  @Get('list/pinball-heads')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchSellPinballHead(
    @Query() pageOptionsDto: PageOptionsDto,
    @UserScope() user: User
  ) {
    const data = await this.marketplaceService.fetchSellPinballHead(
      pageOptionsDto,
      user
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('list/headphones-or-headphone-boxes')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchSellHeadphoneOrHeadphoneBox(
    @Query() pageOptionsDto: PageOptionsDto,
    @HeadphoneOrHeadphoneBoxFilter() filter: HeadphoneOrHeadphoneBoxFilterDto,
    @UserScope() user: User
  ) {
    const data = await this.marketplaceService.fetchSellHeadphoneOrHeadphoneBox(
      pageOptionsDto,
      filter,
      user
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('list/tickets')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchSellTickets(
    @Query() pageOptionsDto: PageOptionsDto,
    @UserScope() user: User
  ) {
    const data = await this.marketplaceService.fetchSellTickets(
      pageOptionsDto,
      user
    );
    return {
      success: true,
      content: data,
    };
  }

  @Get('list/merchandise')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async fetchSellMerchandise(
    @Query() pageOptionsDto: PageOptionsDto,
    @UserScope() user: User
  ) {
    const data = await this.marketplaceService.fetchSellMerchandise(
      pageOptionsDto,
      user
    );
    return {
      success: true,
      content: data,
    };
  }
}
