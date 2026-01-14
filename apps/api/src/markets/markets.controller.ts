import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MarketsService } from './markets.service';

@ApiTags('markets')
@Controller('api/markets')
export class MarketsController {
  constructor(private readonly marketsService: MarketsService) {}

  @Get('smart')
  @ApiOperation({ summary: 'Get smart markets ranked by smart score' })
  async findSmartMarkets(@Query() query: any) {
    return this.marketsService.findSmartMarkets(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get market by ID' })
  async findOne(@Param('id') id: string) {
    return this.marketsService.findOne(id);
  }
}

