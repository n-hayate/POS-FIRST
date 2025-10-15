// app/types/index.ts

/**
 * 商品データの型
 */
export interface Product {
  prd_id: number;
  prd_code: string;
  prd_name: string;
  prd_price: number;
}

/**
 * 購入リスト内の商品の型（数量を含む）
 */
export interface PurchaseItem extends Product {
  quantity: number;
}

/**
 * 商品検索APIのレスポンスの型
 */
export interface ProductSearchResponse {
  product: Product | null;
}

/**
 * 購入APIに送信するリクエストの型
 */
export interface PurchaseRequest {
  emp_cd?: string;
  store_cd: string;
  pos_no: string;
  items: PurchaseItem[];
}

/**
 * 購入APIのレスポンスの型
 */
export interface PurchaseResponse {
  success: boolean;
  total_amount: number;
  total_amount_ex_tax: number;
}
