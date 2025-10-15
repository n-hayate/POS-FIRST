'use client';

import { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  useEffect(() => {
    let html5QrCode: Html5Qrcode | undefined;
    let isScanning = false;

    const startScanner = async () => {
      try {
        html5QrCode = new Html5Qrcode('reader');
        
        await html5QrCode.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
          },
          (decodedText) => {
            // 連続スキャン防止
            if (!isScanning) {
              isScanning = true;
              console.log('[バーコード読取] ', decodedText);
              onScan(decodedText);
              
              // 1秒後に再度スキャン可能にする
              setTimeout(() => {
                isScanning = false;
              }, 1000);
            }
          },
          (errorMessage) => {
            // スキャン中のエラーは無視（正常動作）
          }
        );
        
        console.log('[カメラ起動] 成功');
      } catch (err) {
        console.error('[カメラ起動エラー]', err);
        const message = err instanceof Error ? err.message : "不明なエラー";
        alert(
          `カメラの起動に失敗しました: ${message}\n\n` +
          `• ブラウザのカメラアクセス許可を確認してください\n` +
          `• このサイトはHTTPS接続である必要があります`
        );
        onClose();
      }
    };

    startScanner();

    // クリーンアップ
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop()
          .then(() => console.log('[カメラ停止] 成功'))
          .catch(err => console.error('[カメラ停止エラー]', err));
      }
    };
  }, [onScan, onClose]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50 p-4">
      <div className="bg-white p-6 rounded-2xl shadow-2xl w-full max-w-md">
        <h3 className="text-xl font-bold mb-4 text-center text-gray-800">
          📷 バーコードをスキャン
        </h3>
        <div 
          id="reader" 
          className="w-full aspect-square rounded-lg overflow-hidden border-2 border-blue-300 bg-gray-100"
        />
        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-3 bg-red-600 text-white font-semibold rounded-lg hover:bg-red-700 transition-colors transform active:scale-95"
        >
          ✕ キャンセル
        </button>
      </div>
    </div>
  );
}
