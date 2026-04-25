/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { GoogleGenAI, Type } from "@google/genai";
import { Reservation } from "../types";

let aiInstance: GoogleGenAI | null = null;

function getAI(apiKey?: string) {
  const key = apiKey || process.env.GEMINI_API_KEY;
  if (!key) return null;
  if (!aiInstance) {
    aiInstance = new GoogleGenAI({ apiKey: key });
  }
  return aiInstance;
}

/**
 * Extracts license plate numbers from one or more images of a reservation list.
 */
export async function extractReservationsFromImages(base64Images: string[], apiKey?: string): Promise<Reservation[]> {
  const ai = getAI(apiKey);
  if (!ai) return [];
  const prompt = `
    다음은 자동차 서비스센터의 예약 명단 종이 사진입니다.
    사진에서 차량번호(예: 123가4567, 12가3456 등)와 예약 시간(예: 08:30, 09:00 등)을 모두 추출해 주세요.
    결과는 반드시 JSON 배열 형태로 응답해 주세요.
    중복된 차량번호는 하나만 포함해 주세요.
  `;

  const contents = {
    parts: [
      ...base64Images.map(img => ({
        inlineData: {
          mimeType: "image/jpeg",
          data: img.split(',')[1] || img
        }
      })),
      { text: prompt }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              plateNumber: { type: Type.STRING, description: "차량번호" },
              reservationTime: { type: Type.STRING, description: "예약시간" }
            },
            required: ["plateNumber"]
          }
        }
      }
    });

    const jsonStr = response.text?.trim() || "[]";
    const reservations: any[] = JSON.parse(jsonStr);
    
    return reservations.map((res, index) => ({
      id: `res-${Date.now()}-${index}`,
      plateNumber: res.plateNumber.replace(/\s/g, ''),
      reservationTime: res.reservationTime
    }));
  } catch (error) {
    console.error("Gemini Extraction Error:", error);
    return [];
  }
}

/**
 * Recognizes a single license plate from a captured frame.
 * Optimized for speed by using a direct instruction.
 */
export async function recognizeLicensePlate(base64Image: string, apiKey?: string): Promise<string | null> {
  const ai = getAI(apiKey);
  if (!ai) return null;
  
  // 프롬프트를 극도로 단순화하여 응답 속도를 높입니다.
  const prompt = "이미지에서 차량 번호만 추출하세요. 결과만 반환: (예: 123가4567)";
  
  const contents = {
    parts: [
      {
        inlineData: {
          mimeType: "image/jpeg",
          data: base64Image.split(',')[1] || base64Image
        }
      },
      { text: prompt }
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents
    });

    const plate = response.text?.trim() || null;
    if (plate) {
      // Basic normalization
      return plate.replace(/[^0-9가-힣]/g, '');
    }
    return null;
  } catch (error) {
    console.error("Gemini Recognition Error:", error);
    return null;
  }
}
