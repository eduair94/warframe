/**
 * @fileoverview Utility for calculating statistics from market data
 * @module services/StatisticsCalculator
 * 
 * Single Responsibility: Calculate statistical metrics from price history.
 * Pure utility class with no side effects.
 */

/**
 * Represents a single statistics data point
 */
export interface IStatisticsDataPoint {
  datetime: string;
  volume: number;
  avg_price: number;
  mod_rank?: number;
}

/**
 * Result of statistics calculation
 */
export interface IStatisticsResult {
  /** Total trading volume */
  volume: number;
  /** Volume-weighted average price */
  avg_price: number;
  /** Most recent completed transaction */
  last_completed: IStatisticsDataPoint | null;
}

/**
 * Options for statistics calculation
 */
export interface IStatisticsOptions {
  /** Filter by specific mod rank (undefined = all ranks) */
  modRank?: number;
}

/**
 * Utility class for calculating market statistics
 * 
 * @example
 * ```typescript
 * const stats = StatisticsCalculator.calculate(dataPoints, { modRank: 10 });
 * console.log(`Volume: ${stats.volume}, Avg: ${stats.avg_price}p`);
 * ```
 */
export class StatisticsCalculator {
  /**
   * Calculates statistics from an array of data points
   * 
   * @param dataPoints - Array of statistics data points
   * @param options - Calculation options
   * @returns Calculated statistics
   */
  static calculate(
    dataPoints: IStatisticsDataPoint[],
    options: IStatisticsOptions = {}
  ): IStatisticsResult {
    const { modRank } = options;

    // Filter by mod rank if specified
    const filtered = modRank !== undefined
      ? dataPoints.filter(point => point.mod_rank === modRank)
      : dataPoints;

    if (filtered.length === 0) {
      return {
        volume: 0,
        avg_price: 0,
        last_completed: null
      };
    }

    // Calculate volume-weighted average
    const { totalVolume, totalValue } = filtered.reduce(
      (acc, point) => ({
        totalVolume: acc.totalVolume + point.volume,
        totalValue: acc.totalValue + (point.volume * point.avg_price)
      }),
      { totalVolume: 0, totalValue: 0 }
    );

    const avg_price = totalVolume > 0 ? totalValue / totalVolume : 0;

    // Find most recent transaction
    const sorted = [...filtered].sort(
      (a, b) => new Date(b.datetime).getTime() - new Date(a.datetime).getTime()
    );
    const last_completed = sorted[0] ?? null;

    return {
      volume: totalVolume,
      avg_price,
      last_completed
    };
  }

  /**
   * Calculates median price from data points
   * 
   * @param dataPoints - Array of statistics data points
   * @returns Median price
   */
  static calculateMedianPrice(dataPoints: IStatisticsDataPoint[]): number {
    if (dataPoints.length === 0) return 0;

    const prices = dataPoints
      .map(point => point.avg_price)
      .sort((a, b) => a - b);

    const mid = Math.floor(prices.length / 2);
    
    return prices.length % 2 !== 0
      ? prices[mid]
      : (prices[mid - 1] + prices[mid]) / 2;
  }

  /**
   * Calculates price trend (positive = increasing, negative = decreasing)
   * 
   * @param dataPoints - Array of statistics data points (should be time-ordered)
   * @returns Trend percentage change
   */
  static calculateTrend(dataPoints: IStatisticsDataPoint[]): number {
    if (dataPoints.length < 2) return 0;

    // Sort by date ascending
    const sorted = [...dataPoints].sort(
      (a, b) => new Date(a.datetime).getTime() - new Date(b.datetime).getTime()
    );

    const firstPrice = sorted[0].avg_price;
    const lastPrice = sorted[sorted.length - 1].avg_price;

    if (firstPrice === 0) return 0;
    
    return ((lastPrice - firstPrice) / firstPrice) * 100;
  }
}
