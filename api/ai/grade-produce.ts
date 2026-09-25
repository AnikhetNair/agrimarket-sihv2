import type { VercelRequest, VercelResponse } from '@vercel/node';
import { assessProduceQuality } from '../../src/server/qualityService';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method not allowed',
    });
  }

  try {
    const { image } = req.body || {};

    if (!image) {
      return res.status(400).json({
        success: false,
        error: 'Image is required',
      });
    }

    console.log('[Vercel] Starting produce quality assessment');

    const assessment = await assessProduceQuality(image);

    console.log('[Vercel] Produce quality assessment completed');

    return res.status(200).json({
      success: true,
      assessment,
    });
  } catch (error) {
    console.error(
      '[Vercel] Produce quality assessment failed:',
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
}