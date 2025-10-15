'use client';

import { useState, useEffect, useCallback } from 'react';
import BarcodeScanner from '@/app/components/BarcodeScanner';
import Notification from '@/app/components/Notification';
import { searchProduct, purchaseItems } from '@/app/lib/api';
import type { Product, PurchaseItem, PurchaseRequest } from '@/app/types';

// 税率定数
const TAX_RATE = 0.1; // 10%

// 税抜価格を計算する関数
const calculateExTaxPrice = (priceIncTax: number): number => {
  return Math.floor(priceIncTax / (1 + TAX_RATE));
};

export default function PosPage() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalAmountExTax, setTotalAmountExTax] = useState(0);

  // 合計金額の計算
  useEffect(() => {
    const newTotal = purchaseList.reduce(
      (sum, item) => sum + item.prd_price * item.quantity, 
      0
    );
    const newTotalExTax = purchaseList.reduce(
      (sum, item) => sum + calculateExTaxPrice(item.prd_price) * item.quantity,
      0
    );
    setTotalAmount(newTotal);
    setTotalAmountExTax(newTotalExTax);
  }, [purchaseList]);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  }, []);

  // バーコードスキャン処理
  const handleScan = useCallback(async (result: string) => {
    setIsScannerOpen(false);
    
    try {
      const data = await searchProduct(result);
      
      if (data && data.product) {
        const product = data.product;
        showNotification(`「${product.prd_name}」を読み取りました`, 'success');
        setScannedProduct(product);
      } else {
        showNotification('エラーが発生しました。店員にお声掛けください。', 'error');
        setScannedProduct(null);
      }
    } catch (error: any) {
      showNotification('エラーが発生しました。店員にお声掛けください。', 'error');
      setScannedProduct(null);
    }
  }, [showNotification]);

  // 商品を購入リストに追加
  const handleAddItem = useCallback(() => {
    if (!scannedProduct) return;

    setPurchaseList(prevList => {
      const existingItem = prevList.find(item => item.prd_id === scannedProduct.prd_id);

      if (existingItem) {
        return prevList.map(item =>
          item.prd_id === scannedProduct.prd_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        return [...prevList, { ...scannedProduct, quantity: 1 }];
      }
    });

    setScannedProduct(null);
  }, [scannedProduct]);

  // 数量を増やす
  const handleIncreaseQuantity = useCallback((prd_id: number) => {
    setPurchaseList(prevList =>
      prevList.map(item =>
        item.prd_id === prd_id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      )
    );
  }, []);

  // 数量を減らす
  const handleDecreaseQuantity = useCallback((prd_id: number) => {
    setPurchaseList(prevList => {
      const item = prevList.find(i => i.prd_id === prd_id);
      if (!item) return prevList;

      if (item.quantity === 1) {
        // 数量が1の場合は削除
        return prevList.filter(i => i.prd_id !== prd_id);
      } else {
        // 数量を減らす
        return prevList.map(i =>
          i.prd_id === prd_id
            ? { ...i, quantity: i.quantity - 1 }
            : i
        );
      }
    });
  }, []);

  // リストから商品を削除
  const handleRemoveItem = useCallback((prd_id: number) => {
    setPurchaseList(prevList => prevList.filter(item => item.prd_id !== prd_id));
  }, []);

  // 購入処理
  const handlePurchase = useCallback(async () => {
    if (purchaseList.length === 0) {
      showNotification('購入リストに商品がありません', 'error');
      return;
    }

    try {
      const purchaseData: PurchaseRequest = {
        emp_cd: "",
        store_cd: "30",
        pos_no: "90",
        items: purchaseList
      };

      const data = await purchaseItems(purchaseData);

      if (data.success) {
        showNotification(
          `購入完了！ 合計: ${data.total_amount.toLocaleString()}円 (税抜: ${data.total_amount_ex_tax.toLocaleString()}円)`,
          'success'
        );
        setPurchaseList([]);
        setScannedProduct(null);
      } else {
        showNotification('エラーが発生しました。店員にお声掛けください。', 'error');
      }
    } catch (error: any) {
      showNotification('エラーが発生しました。店員にお声掛けください。', 'error');
    }
  }, [purchaseList, showNotification]);

  return (
    <div className="container mx-auto p-4 bg-gray-50 min-h-screen">
      {notification && (
        <Notification
          message={notification.message}
          type={notification.type}
          onClose={() => setNotification(null)}
        />
      )}

      {isScannerOpen && (
        <BarcodeScanner
          onScan={handleScan}
          onClose={() => setIsScannerOpen(false)}
        />
      )}

      <header className="text-center mb-8">
        <h1 className="text-4xl font-extrabold text-gray-800">モバイルPOSアプリ</h1>
        <p className="text-sm text-gray-600 mt-2">Level 2 - バーコードスキャン対応</p>
      </header>

      <main className="max-w-2xl mx-auto bg-white p-6 rounded-2xl shadow-lg">
        <div className="mb-6">
          <button
            onClick={() => setIsScannerOpen(true)}
            className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors text-lg shadow-md active:scale-95"
          >
            📷 スキャン（カメラ）
          </button>
        </div>

        {scannedProduct && (
          <div className="mb-6 p-4 border-2 border-blue-200 rounded-lg bg-blue-50">
            <h2 className="text-xl font-bold text-gray-700 mb-3">スキャンした商品</h2>
            <div className="space-y-2">
              <p className="text-lg"><span className="font-semibold">コード:</span> {scannedProduct.prd_code}</p>
              <p className="text-lg"><span className="font-semibold">商品名:</span> {scannedProduct.prd_name}</p>
              <p className="text-lg">
                <span className="font-semibold">価格:</span> {scannedProduct.prd_price.toLocaleString()}円
                <span className="text-sm text-gray-600 ml-2">
                  (税抜: {calculateExTaxPrice(scannedProduct.prd_price).toLocaleString()}円)
                </span>
              </p>
            </div>
            <button
              onClick={handleAddItem}
              className="w-full mt-4 bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors active:scale-95"
            >
              ➕ 追加
            </button>
          </div>
        )}

        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b-2 border-gray-200 pb-2 mb-4">
            購入リスト
          </h2>
          <div className="space-y-3">
            {purchaseList.length > 0 ? (
              purchaseList.map((item) => (
                <div key={item.prd_id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{item.prd_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.prd_price.toLocaleString()}円
                        <span className="ml-2">
                          (税抜: {calculateExTaxPrice(item.prd_price).toLocaleString()}円)
                        </span>
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemoveItem(item.prd_id)}
                      className="text-red-500 hover:text-red-700 font-bold text-xl px-2"
                      title="削除"
                    >
                      ✕
                    </button>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => handleDecreaseQuantity(item.prd_id)}
                        className="w-10 h-10 bg-red-500 text-white font-bold rounded-lg hover:bg-red-600 active:scale-95 flex items-center justify-center text-xl"
                      >
                        −
                      </button>
                      <span className="text-xl font-bold w-12 text-center">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => handleIncreaseQuantity(item.prd_id)}
                        className="w-10 h-10 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 active:scale-95 flex items-center justify-center text-xl"
                      >
                        ＋
                      </button>
                    </div>
                    
                    <div className="text-right">
                      <p className="text-lg font-bold text-blue-600">
                        {(item.prd_price * item.quantity).toLocaleString()}円
                      </p>
                      <p className="text-sm text-gray-600">
                        税抜: {(calculateExTaxPrice(item.prd_price) * item.quantity).toLocaleString()}円
                      </p>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">商品がありません</p>
            )}
          </div>
        </div>

        <div className="border-t-2 border-gray-200 pt-4">
          <div className="space-y-2 mb-4">
            <div className="flex justify-between items-center text-lg text-gray-700">
              <span>小計（税抜）</span>
              <span>{totalAmountExTax.toLocaleString()}円</span>
            </div>
            <div className="flex justify-between items-center text-lg text-gray-700">
              <span>消費税（10%）</span>
              <span>{(totalAmount - totalAmountExTax).toLocaleString()}円</span>
            </div>
            <div className="flex justify-between items-center text-2xl font-bold text-gray-800 pt-2 border-t border-gray-300">
              <span>合計金額</span>
              <span className="text-blue-600">{totalAmount.toLocaleString()}円</span>
            </div>
          </div>
          <button
            onClick={handlePurchase}
            className="w-full bg-indigo-600 text-white font-bold py-3 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-xl shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed active:scale-95"
            disabled={purchaseList.length === 0}
          >
            💳 購入
          </button>
        </div>
      </main>
    </div>
  );
}
