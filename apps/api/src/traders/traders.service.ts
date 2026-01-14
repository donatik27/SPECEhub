import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { TraderFilters, PaginatedResponse } from '@polymarket/shared';
import { Trader } from '@polymarket/database';

@Injectable()
export class TradersService {
  constructor(private readonly db: DatabaseService) {}

  async findAll(
    filters: TraderFilters & { page?: number; limit?: number },
  ): Promise<PaginatedResponse<Trader>> {
    const page = filters.page || 1;
    const limit = Math.min(filters.limit || 20, 100);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (filters.tier && filters.tier.length > 0) {
      where.tier = { in: filters.tier };
    }

    if (filters.minPnl !== undefined) {
      where.totalPnl = { ...where.totalPnl, gte: filters.minPnl };
    }

    if (filters.maxPnl !== undefined) {
      where.totalPnl = { ...where.totalPnl, lte: filters.maxPnl };
    }

    if (filters.search) {
      where.OR = [
        { address: { contains: filters.search, mode: 'insensitive' } },
        { displayName: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    const orderBy: any = {};
    if (filters.sortBy) {
      orderBy[filters.sortBy === 'pnl' ? 'totalPnl' : filters.sortBy] = filters.sortOrder || 'desc';
    } else {
      orderBy.rarityScore = 'desc';
    }

    const [data, total] = await Promise.all([
      this.db.trader.findMany({
        where,
        orderBy,
        skip,
        take: limit,
      }),
      this.db.trader.count({ where }),
    ]);

    return {
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: string): Promise<Trader | null> {
    return this.db.trader.findUnique({
      where: { id },
      include: {
        trades: {
          take: 50,
          orderBy: { timestamp: 'desc' },
        },
      },
    });
  }
}

