'use client';

import { useState, useEffect, useCallback, Fragment } from 'react';
import BarcodeScanner from '@/app/components/BarcodeScanner';
import Notification from '@/app/components/Notification';
import { searchProduct, purchaseItems } from '@/app/lib/api';
import type { Product, PurchaseItem, PurchaseRequest } from '@/app/types';

export default function PosPage() {
  const [scannedProduct, setScannedProduct] = useState<Product | null>(null);
  const [purchaseList, setPurchaseList] = useState<PurchaseItem[]>([]);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [totalAmount, setTotalAmount] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  const [showDebug, setShowDebug] = useState(false);

  const addLog = useCallback((message: string) => {
    const timestamp = new Date().toLocaleTimeString('ja-JP');
    setLogs(prev => [`[${timestamp}] ${message}`, ...prev].slice(0, 50));
  }, []);

  // 合計金額の計算
  useEffect(() => {
    const newTotal = purchaseList.reduce(
      (sum, item) => sum + item.prd_price * item.quantity, 
      0
    );
    setTotalAmount(newTotal);
  }, [purchaseList]);

  const showNotification = useCallback((message: string, type: 'success' | 'error') => {
    setNotification({ message, type });
  }, []);

  // バーコードスキャン処理
  const handleScan = useCallback(async (result: string) => {
    setIsScannerOpen(false);
    addLog(`スキャン: ${result}`);
    
    try {
      addLog('商品検索中...');
      const data = await searchProduct(result);
      
      if (data && data.product) {
        const product = data.product;
        addLog(`商品発見: ${product.prd_name} (${product.prd_price}円)`);
        showNotification(`「${product.prd_name}」を読み取りました`, 'success');
        setScannedProduct(product);
      } else {
        addLog('商品が見つかりませんでした');
        showNotification('商品が見つかりませんでした', 'error');
        setScannedProduct(null);
      }
    } catch (error: any) {
      addLog(`[エラー] ${error.message}`);
      showNotification('商品検索でエラーが発生しました', 'error');
      setScannedProduct(null);
    }
  }, [addLog, showNotification]);

  // 商品を購入リストに追加
  const handleAddItem = useCallback(() => {
    if (!scannedProduct) return;

    setPurchaseList(prevList => {
      const existingItem = prevList.find(item => item.prd_id === scannedProduct.prd_id);

      if (existingItem) {
        addLog(`数量+1: ${scannedProduct.prd_name}`);
        return prevList.map(item =>
          item.prd_id === scannedProduct.prd_id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      } else {
        addLog(`リスト追加: ${scannedProduct.prd_name}`);
        return [...prevList, { ...scannedProduct, quantity: 1 }];
      }
    });

    setScannedProduct(null);
  }, [scannedProduct, addLog]);

  // 購入処理
  const handlePurchase = useCallback(async () => {
    if (purchaseList.length === 0) {
      showNotification('購入リストに商品がありません', 'error');
      return;
    }

    addLog(`購入処理開始: ${purchaseList.length}種類の商品`);

    try {
      const purchaseData: PurchaseRequest = {
        emp_cd: "",
        store_cd: "30",
        pos_no: "90",
        items: purchaseList
      };

      const data = await purchaseItems(purchaseData);
      addLog(`購入成功: 合計${data.total_amount}円`);

      if (data.success) {
        showNotification(
          `購入完了！ 合計: ${data.total_amount.toLocaleString()}円 (税抜: ${data.total_amount_ex_tax.toLocaleString()}円)`,
          'success'
        );
        setPurchaseList([]);
        setScannedProduct(null);
      } else {
        showNotification('購入処理に失敗しました', 'error');
      }
    } catch (error: any) {
      addLog(`[購入エラー] ${error.message}`);
      showNotification('購入中にエラーが発生しました', 'error');
    }
  }, [purchaseList, addLog, showNotification]);

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
              <p className="text-lg"><span className="font-semibold">価格:</span> {scannedProduct.prd_price.toLocaleString()}円</p>
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
          <div className="space-y-2">
            {purchaseList.length > 0 ? (
              purchaseList.map((item) => (
                <div key={item.prd_id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="flex-1 font-medium">{item.prd_name}</span>
                  <span className="w-32 text-right text-gray-700">
                    {item.prd_price.toLocaleString()}円 × {item.quantity}
                  </span>
                  <span className="w-24 text-right font-bold text-blue-600">
                    {(item.prd_price * item.quantity).toLocaleString()}円
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center py-8">商品がありません</p>
            )}
          </div>
        </div>

        <div className="border-t-2 border-gray-200 pt-4">
          <div className="flex justify-between items-center text-2xl font-bold text-gray-800 mb-4">
            <span>合計金額</span>
            <span className="text-blue-600">{totalAmount.toLocaleString()}円</span>
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

      <footer className="max-w-2xl mx-auto mt-4">
        <button
          onClick={() => setShowDebug(!showDebug)}
          className="w-full text-sm text-gray-600 bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded-lg transition-colors"
        >
          {showDebug ? '▲ デバッグログを隠す' : '▼ デバッグログを表示'}
        </button>
        {showDebug && (
          <>
            <div className="mt-2 p-4 bg-gray-800 text-green-400 rounded-lg text-xs font-mono whitespace-pre-wrap h-64 overflow-y-auto">
              {logs.length > 0 ? logs.map((log, i) => (
                <Fragment key={i}>{log}<br /></Fragment>
              )) : "ログはありません"}
            </div>
            <button
              onClick={() => setLogs([])}
              className="w-full text-xs text-gray-500 hover:text-gray-700 mt-1"
            >
              ログをクリア
            </button>
          </>
        )}
      </footer>
    </div>
  );
}
