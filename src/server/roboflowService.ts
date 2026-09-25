export interface RoboflowPrediction {
  class: string;
  confidence: number;
}

export interface RoboflowResult {
  top?: string;
  confidence?: number;
  predictions?: RoboflowPrediction[];
  prediction_type?: string;
}

export async function classifyProduce(
  base64Image: string
): Promise<RoboflowResult> {
  const apiKey = process.env.ROBOFLOW_API_KEY;
  const model = process.env.ROBOFLOW_MODEL;
  const version = process.env.ROBOFLOW_VERSION || "1";

  if (!apiKey) {
    throw new Error("ROBOFLOW_API_KEY is not configured");
  }

  if (!model) {
    throw new Error("ROBOFLOW_MODEL is not configured");
  }

  const endpoint =
    `https://classify.roboflow.com/${model}/${version}` +
    `?api_key=${encodeURIComponent(apiKey)}`;

  const cleanBase64 = base64Image.replace(
    /^data:image\/[a-zA-Z0-9.+-]+;base64,/,
    ""
  );

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: cleanBase64,
  });

  if (!response.ok) {
    const errorText = await response.text();

    throw new Error(
      `Roboflow request failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}
