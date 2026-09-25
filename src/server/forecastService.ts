import axios from 'axios';

export interface ForecastHistoryPoint {
  date: string;
  price: number;
}

export interface ForecastRequest {
  commodity_id: string;
  market_id: string;
  history: ForecastHistoryPoint[];
  horizon?: number;
}

export interface ForecastPoint {
  day: number;
  predicted_price: number;
}

export interface ForecastResponse {
  status: string;
  commodity_id: string;
  market_id: string;
  history_points: number;
  model: string;
  forecast_horizon: number;
  forecast: ForecastPoint[];
}

/**
 * Pure TypeScript implementation of linear regression price forecasting
 * Replaces external Python microservice with zero runtime dependencies.
 */
export function computeLinearRegressionForecast(
  request: ForecastRequest
): ForecastResponse {
  const sorted = [...request.history].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  const prices = sorted.map((p) => Number(p.price));

  if (prices.length < 3) {
    throw new Error('At least 3 historical price points are required');
  }

  const n = prices.length;
  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumXX = 0;

  for (let i = 0; i < n; i++) {
    const x = i;
    const y = prices[i];
    sumX += x;
    sumY += y;
    sumXY += x * y;
    sumXX += x * x;
  }

  const denominator = n * sumXX - sumX * sumX;
  const slope = denominator !== 0 ? (n * sumXY - sumX * sumY) / denominator : 0;
  const intercept = (sumY - slope * sumX) / n;

  const horizon = request.horizon ?? 5;
  const forecast: ForecastPoint[] = [];

  for (let day = 1; day <= horizon; day++) {
    const futureX = n - 1 + day;
    const rawPred = slope * futureX + intercept;
    const predictedPrice = Math.round(Math.max(0, rawPred) * 100) / 100;
    forecast.push({
      day,
      predicted_price: predictedPrice,
    });
  }

  return {
    status: 'success',
    commodity_id: request.commodity_id,
    market_id: request.market_id,
    history_points: n,
    model: 'linear_regression_baseline',
    forecast_horizon: horizon,
    forecast,
  };
}

export async function requestForecast(
  request: ForecastRequest
): Promise<ForecastResponse> {
  const mlServiceUrl = process.env.ML_SERVICE_URL;

  if (mlServiceUrl) {
    try {
      const response = await axios.post<ForecastResponse>(
        `${mlServiceUrl}/forecast`,
        request,
        { timeout: 3000 }
      );
      if (response.data?.forecast) {
        return response.data;
      }
    } catch (err: any) {
      console.warn(
        `[Forecast Service] External ML service at ${mlServiceUrl} unavailable (${err?.message}). Using native engine.`
      );
    }
  }

  return computeLinearRegressionForecast(request);
}

