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
  // @google/genai SDK 사양에 맞춰 초기화
  return new GoogleGenAI({ apiKey: key });
}

/**
 * Extracts license plate numbers from one or more images of a reservation list.
 */
export async function extractReservationsFromImages(base64Images: string[], apiKey?: string): Promise<Reservation[]> {
  const ai = getAI(apiKey);
  if (!ai) return [];
  
  const prompt = `당신은 자동차 서비스 센터의 운영 전문가입니다. 첨부된 사진 속에서 '차량번호'와 '예약시간'을 찾아 JSON 배열로 응답하세요. (예: [{"plateNumber": "123가4567", "reservationTime": "09:30"}]) 다른 설명 없이 결과만 반환하세요.`;

  try {
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

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents
    });

    const text = response.text?.trim() || "[]";
    const jsonMatch = text.match(/\[.*\]/s);
    const jsonStr = jsonMatch ? jsonMatch[0] : "[]";
    const extractedData: any[] = JSON.parse(jsonStr);
    
    return extractedData.map((res, index) => ({
      id: `res-${Date.now()}-${index}`,
      plateNumber: res.plateNumber?.toString().replace(/\s/g, '') || "",
      reservationTime: res.reservationTime?.toString() || ""
    })).filter(r => r.plateNumber.length > 0);
  } catch (error: any) {
    console.error("Gemini 명단 추출 오류:", error);
    throw error;
  }
}

/**
 * Recognizes a single license plate from a captured frame.
 * Optimized for speed by using a direct instruction.
 */
export async function recognizeLicensePlate(base64Image: string, apiKey?: string): Promise<string | null> {
  const ai = getAI(apiKey);
  if (!ai) return null;
  
  const prompt = "이미지 속의 차량 번호판 문자와 숫자를 모두 읽어주세요. 다른 설명 없이 번호만 출력하세요 (예: 123가4567).";
  
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: base64Image.split(',')[1] || base64Image
            }
          },
          { text: prompt }
        ]
      }
    });

    const plate = response.text?.trim() || null;
    if (plate) {
      return plate.replace(/[^0-9가-힣]/g, '');
    }
    return null;
  } catch (error) {
    console.error("Gemini 번호 인식 오류:", error);
    return null;
  }
}
