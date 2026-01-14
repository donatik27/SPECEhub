import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { TradersService } from './traders.service';

@ApiTags('traders')
@Controller('api/traders')
export class TradersController {
  constructor(private readonly tradersService: TradersService) {}

  @Get()
  @ApiOperation({ summary: 'Get all traders with filters' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'tier', required: false, type: String, isArray: true })
  @ApiQuery({ name: 'minPnl', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiQuery({ name: 'sortBy', required: false, enum: ['pnl', 'rarityScore', 'winRate', 'lastActive'] })
  async findAll(@Query() query: any) {
    const filters = {
      ...query,
      tier: query.tier ? (Array.isArray(query.tier) ? query.tier : [query.tier]) : undefined,
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      minPnl: query.minPnl ? parseFloat(query.minPnl) : undefined,
    };
    return this.tradersService.findAll(filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get trader by ID' })
  async findOne(@Param('id') id: string) {
    return this.tradersService.findOne(id);
  }
}

