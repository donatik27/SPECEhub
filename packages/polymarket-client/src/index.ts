import axios, { AxiosInstance } from 'axios';

export interface PolymarketConfig {
  gammaApiUrl?: string;
  clobApiUrl?: string;
  timeout?: number;
}

export class PolymarketClient {
  private gammaClient: AxiosInstance;
  private clobClient: AxiosInstance;

  constructor(config: PolymarketConfig = {}) {
    const {
      gammaApiUrl = 'https://gamma-api.polymarket.com',
      clobApiUrl = 'https://clob.polymarket.com',
      timeout = 10000,
    } = config;

    this.gammaClient = axios.create({
      baseURL: gammaApiUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.clobClient = axios.create({
      baseURL: clobApiUrl,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Get markets
  async getMarkets(params?: { limit?: number; offset?: number }) {
    const { limit = 100, offset = 0 } = params || {};
    const response = await this.gammaClient.get('/markets', {
      params: { limit, offset, active: true },
    });
    return response.data;
  }

  // Get market by ID
  async getMarket(conditionId: string) {
    const response = await this.gammaClient.get(`/markets/${conditionId}`);
    return response.data;
  }

  // Get events (markets grouped)
  async getEvents(params?: { limit?: number; offset?: number }) {
    const { limit = 100, offset = 0 } = params || {};
    const response = await this.gammaClient.get('/events', {
      params: { limit, offset },
    });
    return response.data;
  }

  // Get prices for market
  async getPrices(conditionId: string) {
    const response = await this.clobClient.get(`/prices/${conditionId}`);
    return response.data;
  }

  // Get orderbook
  async getOrderbook(tokenId: string) {
    const response = await this.clobClient.get(`/book`, {
      params: { token_id: tokenId },
    });
    return response.data;
  }

  // Get trades for market
  async getTrades(params: { market?: string; maker?: string; limit?: number }) {
    const response = await this.clobClient.get('/trades', { params });
    return response.data;
  }

  // Get user positions
  async getUserPositions(address: string) {
    try {
      const response = await this.clobClient.get(`/positions/${address}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching positions:', error);
      return [];
    }
  }
}

export default PolymarketClient;

