'use client';

import { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

interface BarcodeScannerProps {
  onScan: (result: string) => void;
  onClose: () => void;
}

export default function BarcodeScanner({ onScan, onClose }: BarcodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | undefined;
    let scanLock = false;

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
            if (!scanLock) {
              scanLock = true;
              console.log('[バーコード読取] ', decodedText);
              setIsScanning(true);
              onScan(decodedText);
              
              // 1秒後に再度スキャン可能にする
              setTimeout(() => {
                scanLock = false;
                setIsScanning(false);
              }, 1000);
            }
          },
          (errorMessage) => {
            // スキャン中のエラーは無視（正常動作）
            // ただし、重大なエラーはログに記録
            if (errorMessage.includes('NotAllowedError')) {
              setError('カメラへのアクセスが拒否されました');
            }
          }
        );
        
        console.log('[カメラ起動] 成功');
      } catch (err: any) {
        console.error('[カメラ起動エラー]', err);
        
        // エラーメッセージを判定
        if (err.name === 'NotAllowedError' || err.message.includes('Permission')) {
          setError('カメラへのアクセスが許可されていません。ブラウザの設定を確認してください。');
        } else if (err.name === 'NotFoundError') {
          setError('カメラが見つかりませんでした。デバイスにカメラが接続されているか確認してください。');
        } else if (err.name === 'NotReadableError') {
          setError('カメラがすでに使用中です。他のアプリを閉じてから再度お試しください。');
        } else {
          setError('カメラの起動に失敗しました。店員にお声掛けください。');
        }
        
        // 3秒後に自動で閉じる
        setTimeout(() => {
          onClose();
        }, 3000);
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
        
        {error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4" role="alert">
            <p className="font-bold">エラー</p>
            <p className="text-sm">{error}</p>
          </div>
        ) : null}
        
        {isScanning && (
          <div className="bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4" role="alert">
            <p className="text-sm">読み取り中...</p>
          </div>
        )}
        
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
