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
    throw new Error("API URLが設定されていません。管理者に連絡してください。");
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
      let errorMessage = `HTTPエラー (${response.status})`;
      
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch {
        // JSONパースに失敗した場合はテキストを取得
        const errorText = await response.text();
        if (errorText) {
          errorMessage = errorText;
        }
      }
      
      console.error(`[API Error] ${response.status}: ${errorMessage}`);
      throw new Error(errorMessage);
    }
    
    return await response.json();
  } catch (error: unknown) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      // ネットワークエラー
      console.error(`[Network Error] ${url}`, error);
      throw new Error("ネットワークエラー: サーバーに接続できません。インターネット接続を確認してください。");
    }
    
    // その他のエラー
    const err = error as Error;
    console.error(`[API Request Failed] ${url}`, err);
    throw err;
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
  
  try {
    return await fetchAPI<{ product: Product | null }>("/search_product", {
      method: "POST",
      body: JSON.stringify({ code: code.trim() }),
    });
  } catch (error) {
    console.error('[商品検索エラー]', error);
    throw error;
  }
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
  
  try {
    return await fetchAPI<PurchaseResponse>("/purchase", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    console.error('[購入エラー]', error);
    throw error;
  }
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
  try {
    return await fetchAPI("/", { method: "GET" });
  } catch (error) {
    console.error('[ヘルスチェックエラー]', error);
    throw error;
  }
}
