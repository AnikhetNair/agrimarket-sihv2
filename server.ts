import express from 'express';

import { requestForecast } from './src/server/forecastService';

import path from 'path';

import { createServer as createViteServer } from 'vite';

import { GoogleGenAI } from '@google/genai';

import dotenv from 'dotenv';

import {
  convertUnit,
  type SupportedUnit,
} from './src/server/unitNormalization';

dotenv.config({
  path: path.resolve(process.cwd(), '.env'),
});

let aiClient: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });
  }

  return aiClient;
}

async function startServer() {
  // Load services only after dotenv has loaded the environment variables
  const { supabaseAdmin } = await import('./src/server/supabaseAdmin');
  const { assessProduceQuality } =
    await import('./src/server/qualityService');

  const app = express();

  const PORT = 3000;

  app.use(express.json({ limit: "10mb" }));

  app.get('/api/markets', async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('markets')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('[Markets API]', error);

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      return res.json({
        success: true,
        markets: data ?? [],
      });
    } catch (error) {
      console.error('[Markets API]', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch markets',
      });
    }
  });

  app.get('/api/market-prices', async (req, res) => {
    try {
      const commodityId =
        typeof req.query.commodity_id === 'string'
          ? req.query.commodity_id
          : undefined;

      const marketId =
        typeof req.query.market_id === 'string'
          ? req.query.market_id
          : undefined;

      let query = supabaseAdmin
        .from('market_prices')
        .select(`
          id,
          price_date,
          min_price,
          modal_price,
          max_price,
          unit,
          source,
          commodity_id,
          market_id,
          commodities (
            name,
            variety
          ),
          markets (
            name,
            district,
            state
          )
        `)
        .order('price_date', { ascending: false });

      if (commodityId) {
        query = query.eq('commodity_id', commodityId);
      }

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Market Prices API]', error);

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      return res.json({
        success: true,
        prices: data ?? [],
      });
    } catch (error) {
      console.error('[Market Prices API]', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch market prices',
      });
    }
  });

  // ============================================================
  // AI PRODUCE QUALITY ASSESSMENT
  // ============================================================

  app.post('/api/ai/grade-produce', async (req, res) => {
    try {
      const { image } = req.body;

      if (!image) {
        return res.status(400).json({
          success: false,
          error: 'Image is required',
        });
      }

      const assessment = await assessProduceQuality(image);

      return res.json({
        success: true,
        assessment,
      });
    } catch (error) {
      console.error(
        'Produce quality assessment failed:',
        error
      );

      return res.status(500).json({
        success: false,
        error:
          error instanceof Error
            ? error.message
            : 'Quality assessment failed',
      });
    }
  });

  // ============================================================
  // MARKET ARRIVALS
  // ============================================================

  app.get('/api/market-arrivals', async (req, res) => {
    try {
      const commodityId =
        typeof req.query.commodity_id === 'string'
          ? req.query.commodity_id
          : undefined;

      const marketId =
        typeof req.query.market_id === 'string'
          ? req.query.market_id
          : undefined;

      let query = supabaseAdmin
        .from('market_arrivals')
        .select(`
          id,
          arrival_date,
          quantity,
          unit,
          source,
          commodity_id,
          market_id,
          commodities (
            name,
            variety
          ),
          markets (
            name,
            district,
            state
          )
        `)
        .order('arrival_date', { ascending: false });

      if (commodityId) {
        query = query.eq('commodity_id', commodityId);
      }

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[Market Arrivals API]', error);

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      return res.json({
        success: true,
        arrivals: data ?? [],
      });
    } catch (error) {
      console.error('[Market Arrivals API]', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch market arrivals',
      });
    }
  });

  // ============================================================
  // MARKET COMPARISON
  // ============================================================

  app.get('/api/market-comparison', async (req, res) => {
    try {
      const commodityId =
        typeof req.query.commodity_id === 'string'
          ? req.query.commodity_id
          : undefined;

      if (!commodityId) {
        return res.status(400).json({
          success: false,
          error: 'commodity_id is required',
        });
      }

      const {
        data: commodity,
        error: commodityError,
      } = await supabaseAdmin
        .from('commodities')
        .select('*')
        .eq('id', commodityId)
        .eq('is_active', true)
        .single();

      if (commodityError || !commodity) {
        return res.status(404).json({
          success: false,
          error: 'Commodity not found',
        });
      }

      const {
        data: prices,
        error: pricesError,
      } = await supabaseAdmin
        .from('market_prices')
        .select(`
          id,
          price_date,
          min_price,
          modal_price,
          max_price,
          unit,
          source,
          market_id,
          markets (
            name,
            district,
            state
          )
        `)
        .eq('commodity_id', commodityId)
        .order('price_date', { ascending: false });

      if (pricesError) {
        console.error(
          '[Market Comparison - Prices]',
          pricesError
        );

        return res.status(500).json({
          success: false,
          error: pricesError.message,
        });
      }

      const {
        data: arrivals,
        error: arrivalsError,
      } = await supabaseAdmin
        .from('market_arrivals')
        .select(`
          id,
          arrival_date,
          quantity,
          unit,
          market_id
        `)
        .eq('commodity_id', commodityId)
        .order('arrival_date', { ascending: false });

      if (arrivalsError) {
        console.error(
          '[Market Comparison - Arrivals]',
          arrivalsError
        );

        return res.status(500).json({
          success: false,
          error: arrivalsError.message,
        });
      }

      const latestPrices = new Map<string, any>();

      for (const price of prices ?? []) {
        if (!latestPrices.has(price.market_id)) {
          latestPrices.set(price.market_id, price);
        }
      }

      const latestArrivals = new Map<string, any>();

      for (const arrival of arrivals ?? []) {
        if (!latestArrivals.has(arrival.market_id)) {
          latestArrivals.set(
            arrival.market_id,
            arrival
          );
        }
      }

      const comparisons = Array.from(
        latestPrices.values()
      ).map((price: any) => {
        const arrival = latestArrivals.get(
          price.market_id
        );

        return {
          market_id: price.market_id,
          market: price.markets,
          price_date: price.price_date,
          min_price: price.min_price,
          modal_price: price.modal_price,
          max_price: price.max_price,
          price_unit: price.unit,
          arrival_quantity:
            arrival?.quantity ?? null,
          arrival_unit:
            arrival?.unit ?? null,
          source: price.source,
        };
      });

      comparisons.sort(
        (a, b) => b.modal_price - a.modal_price
      );

      const rankedMarkets = comparisons.map(
        (market, index) => ({
          ...market,
          rank: index + 1,
        })
      );

      return res.json({
        success: true,
        commodity: {
          id: commodity.id,
          name: commodity.name,
          variety: commodity.variety,
          unit: commodity.unit,
        },
        markets: rankedMarkets,
        best_market: rankedMarkets[0] ?? null,
      });
    } catch (error) {
      console.error(
        '[Market Comparison API]',
        error
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to generate market comparison',
      });
    }
  });

  // ============================================================
  // PRICE HISTORY
  // ============================================================

  app.get('/api/price-history', async (req, res) => {
    try {
      const commodityId =
        typeof req.query.commodity_id === 'string'
          ? req.query.commodity_id
          : undefined;

      const marketId =
        typeof req.query.market_id === 'string'
          ? req.query.market_id
          : undefined;

      if (!commodityId) {
        return res.status(400).json({
          success: false,
          error: 'commodity_id is required',
        });
      }

      let query = supabaseAdmin
        .from('market_prices')
        .select(`
          id,
          price_date,
          min_price,
          modal_price,
          max_price,
          unit,
          source,
          commodity_id,
          market_id,
          markets (
            name,
            district,
            state
          )
        `)
        .eq('commodity_id', commodityId)
        .order('price_date', { ascending: true });

      if (marketId) {
        query = query.eq('market_id', marketId);
      }

      const { data, error } = await query;

      if (error) {
        console.error(
          '[Price History API]',
          error
        );

        return res.status(500).json({
          success: false,
          error: error.message,
        });
      }

      return res.json({
        success: true,
        commodity_id: commodityId,
        market_id: marketId ?? null,
        history: data ?? [],
      });
    } catch (error) {
      console.error(
        '[Price History API]',
        error
      );

      return res.status(500).json({
        success: false,
        error: 'Failed to fetch price history',
      });
    }
  });

  // ============================================================
  // FORECAST
  // ============================================================

  app.get('/api/forecast', async (req, res) => {
    try {
      const commodityId = String(
        req.query.commodity_id || ''
      );

      const marketId = String(
        req.query.market_id || ''
      );

      if (!commodityId || !marketId) {
        return res.status(400).json({
          success: false,
          error:
            'commodity_id and market_id are required',
        });
      }

      const { data, error } = await supabaseAdmin
        .from('market_prices')
        .select(
          'price_date, modal_price'
        )
        .eq('commodity_id', commodityId)
        .eq('market_id', marketId)
        .order('price_date', {
          ascending: true,
        });

      if (error) {
        throw error;
      }

      if (!data || data.length < 10) {
        return res.status(400).json({
          success: false,
          error:
            'At least 10 historical price records are required',
        });
      }

      const history = data.map((row) => ({
        date: row.price_date,
        price: Number(row.modal_price),
      }));

      const forecast = await requestForecast({
        commodity_id: commodityId,
        market_id: marketId,
        history,
        horizon: 5,
      });

      return res.json({
        success: true,
        ...forecast,
      });
    } catch (error) {
      console.error('Forecast error:', error);

      return res.status(500).json({
        success: false,
        error: 'Failed to generate forecast',
      });
    }
  });

  // ============================================================
  // COMMODITIES
  // ============================================================

  app.get('/api/commodities', async (_req, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('commodities')
        .select('*')
        .eq('is_active', true)
        .order('name', {
          ascending: true,
        });

      if (error) {
        console.error(
          'Supabase commodities error:',
          error
        );

        return res.status(500).json({
          error: 'Failed to fetch commodities',
          details: error.message,
        });
      }

      return res.json({
        success: true,
        commodities: data ?? [],
      });
    } catch (err: any) {
      console.error(
        'Commodities API error:',
        err?.message
      );

      return res.status(500).json({
        error: 'Internal server error',
      });
    }
  });

  // ============================================================
  // HEALTH CHECK
  // ============================================================

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      service:
        'AgriMarket Intelligence Platform Server',
      demoMode: true,
      hasGeminiKey:
        Boolean(process.env.GEMINI_API_KEY),
    });
  });

  // ============================================================
  // AI EXPLANATION
  // ============================================================

  app.post('/api/ai/explain', async (req, res) => {
    try {
      const { type, contextData } = req.body;

      const ai = getGeminiClient();

      if (!ai) {
        return res.json({
          source: 'DETERMINISTIC_FALLBACK',
          explanation:
            'AI explanation key not configured. Using deterministic engine findings directly.',
        });
      }

      const prompt = `
You are the AgriMarket Intelligence AI explanation engine.

You are provided with verified, deterministic market and transaction figures.

DO NOT fabricate numbers, prices, buyers, or percentages. Use ONLY the data provided below to write a concise, professional, 2-to-3 sentence explanation for an Indian farmer or FPO manager.

Context Type: ${type}

Data provided:

${JSON.stringify(contextData, null, 2)}

Provide an objective, clear explanation highlighting why the recommendation was made and the financial impact on net realization.
`;

      const response =
        await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
        });

      return res.json({
        source: 'GEMINI_AI',
        explanation:
          response.text ||
          'Explanation generated successfully.',
      });
    } catch (err: any) {
      console.error(
        'Gemini explanation error:',
        err?.message
      );

      return res.json({
        source: 'DETERMINISTIC_FALLBACK',
        explanation:
          'AI service temporarily unavailable. Relying on verified deterministic metrics.',
      });
    }
  });

  // ============================================================
  // NATURAL LANGUAGE LOT EXTRACTION
  // ============================================================

  app.post(
    '/api/ai/extract-lot',
    async (req, res) => {
      try {
        const { text } = req.body;

        const ai = getGeminiClient();

        if (!ai || !text) {
          return res.status(400).json({
            error:
              'Gemini AI or input text missing',
          });
        }

        const prompt = `
Extract structured agricultural produce lot parameters from this farmer's description:

"${text}"

Return STRICT JSON matching this format:

{
  "commodity": string,
  "variety": string,
  "quantity": number,
  "grade": string,
  "origin": string,
  "district": string,
  "state": string,
  "askingPrice": number,
  "harvestDate": string
}

Do not add any markdown tags or backticks outside the JSON.
`;

        const response =
          await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

        let jsonStr = (
          response.text || '{}'
        ).trim();

        if (jsonStr.startsWith('```json')) {
          jsonStr = jsonStr
            .replace(/^```json/, '')
            .replace(/```$/, '')
            .trim();
        } else if (
          jsonStr.startsWith('```')
        ) {
          jsonStr = jsonStr
            .replace(/^```/, '')
            .replace(/```$/, '')
            .trim();
        }

        const extracted =
          JSON.parse(jsonStr);

        return res.json({
          success: true,
          extracted,
        });
      } catch (err: any) {
        console.error(
          'Lot extraction error:',
          err?.message
        );

        return res.status(500).json({
          error:
            'Failed to extract lot details from text',
        });
      }
    }
  );

  // ============================================================
  // AGRICULTURAL ASSISTANT
  // ============================================================

  app.post(
    '/api/ai/assistant',
    async (req, res) => {
      try {
        const {
          query,
          activeRole,
          platformContext,
        } = req.body;

        const ai = getGeminiClient();

        if (!ai) {
          return res.json({
            reply:
              'AI Assistant requires GEMINI_API_KEY. However, all core market intelligence, net realization formulas, matching algorithms, and transactions are fully operational deterministically.',
          });
        }

        const prompt = `
You are the AgriMarket Intelligence Platform Assistant for Indian Agriculture.

The user is currently acting as role: ${
          activeRole || 'FARMER'
        }.

Answer their query strictly using the following live platform context. DO NOT hallucinate prices or fake buyers that do not exist in the context:

Platform Context:

${JSON.stringify(
  platformContext || {},
  null,
  2
)}

User Question:

"${query}"

Guidelines:

- Keep the response direct, helpful, and concise (under 150 words).
- Quote real mandi prices and net realization figures from the context.
- Mention specific market names (e.g., Lasalgaon, Nashik, Pune) and transport deductions when relevant.
- State clearly if certain requested data is not present in the platform records.
`;

        const response =
          await ai.models.generateContent({
            model: 'gemini-3.8-flash',
            contents: prompt,
          });

        return res.json({
          reply:
            response.text ||
            'No response generated.',
        });
      } catch (err: any) {
        console.error(
          'Assistant error:',
          err?.message
        );

        return res.status(500).json({
          reply:
            'Assistant is temporarily busy. Please refer to the market intelligence tables directly.',
        });
      }
    }
  );

  // ============================================================
  // VITE MIDDLEWARE
  // ============================================================

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    const distPath = path.join(
      process.cwd(),
      'dist'
    );

    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(
        path.join(
          distPath,
          'index.html'
        )
      );
    });
  }

  // ============================================================
  // START SERVER
  // ============================================================

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`[AgriMarket Server] running on http://0.0.0.0:${PORT}`);
  });
}

startServer();