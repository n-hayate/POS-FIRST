/**
 * POS System API Client
 * バックエンドAPIとの通信を管理
 */
import type { Product, PurchaseRequest, PurchaseResponse } from "@/app/types";

/**
 * API URL取得と検証
 */
const getApiUrl = (): string => {
  // Next.jsの環境変数（ビルド時に埋め込まれる）
  const raw = process.env.NEXT_PUBLIC_API_URL;
  
  if (!raw) {
    console.error("[API設定エラー] NEXT_PUBLIC_API_URLが未設定です");
    throw new Error("API URLが設定されていません");
  }
  
  // プロトコル補完
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  
  // 末尾スラッシュ除去
  return withProto.replace(/\/$/, "");
};

const API_URL = getApiUrl();

// 開発環境でのログ（ブラウザでのみ実行）
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  console.log(`[API] Connecting to: ${API_URL}`);
}

/**
 * 共通フェッチヘルパー
 */
async function fetchAPI<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
    },
    ...options,
  };
  
  try {
    const response = await fetch(url, defaultOptions);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[API Error] ${response.status}: ${errorText}`);
      throw new Error(
        `API Error (${response.status}): ${errorText || response.statusText}`
      );
    }
    
    return await response.json();
  } catch (error: unknown) {
    const err = error as Error;
    console.error(`[API Request Failed] ${url}`, err);
    throw new Error(err.message || "APIリクエストに失敗しました");
  }
}

/**
 * 商品検索API
 * @param code 商品コード
 * @returns 商品情報（見つからない場合はnull）
 */
export async function searchProduct(
  code: string
): Promise<{ product: Product | null }> {
  if (!code.trim()) {
    throw new Error("商品コードを入力してください");
  }
  
  console.log(`[商品検索] コード: ${code}`);
  
  return fetchAPI<{ product: Product | null }>("/search_product", {
    method: "POST",
    body: JSON.stringify({ code: code.trim() }),
  });
}

/**
 * 購入API
 * @param payload 購入情報
 * @returns 購入結果
 */
export async function purchaseItems(
  payload: PurchaseRequest
): Promise<PurchaseResponse> {
  if (!payload.items || payload.items.length === 0) {
    throw new Error("購入する商品を選択してください");
  }
  
  console.log(`[購入リクエスト] ${payload.items.length}件の商品`);
  
  return fetchAPI<PurchaseResponse>("/purchase", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

/**
 * ヘルスチェックAPI
 * @returns APIの状態
 */
export async function healthCheck(): Promise<{
  status: string;
  service: string;
  version: string;
}> {
  return fetchAPI("/", { method: "GET" });
}