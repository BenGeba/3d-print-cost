import { useState, useRef } from 'react';
import QRCode from 'react-qr-code';
import { AppState } from '../types';
import { generateShareUrl } from '../utils';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ShareModal({ isOpen, onClose, appState, onSuccess, onError }: ShareModalProps) {
  const [shareOption, setShareOption] = useState<'qr' | null>(null);
  const qrRef = useRef<HTMLDivElement>(null);

  // Generate shareable URL for QR code
  const getShareData = (): string => {
    try {
      return generateShareUrl(appState);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error creating share URL');
      return '';
    }
  };

  // Download QR code as PNG
  const downloadQRCode = async (): Promise<void> => {
    try {
      if (!qrRef.current) {
        onError('QR code not found');
        return;
      }

      const svg = qrRef.current.querySelector('svg');
      if (!svg) {
        onError('QR code SVG not found');
        return;
      }

      // Create canvas and convert SVG to PNG
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        onError('Canvas context not available');
        return;
      }

      const svgData = new XMLSerializer().serializeToString(svg);
      const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
      const svgUrl = URL.createObjectURL(svgBlob);

      const img = new Image();
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(img, 0, 0);
        
        canvas.toBlob((blob) => {
          if (!blob) {
            onError('Error creating PNG file');
            return;
          }

          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = `3d-print-calculator-${new Date().toISOString().slice(0, 10)}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          URL.revokeObjectURL(url);
          onSuccess('QR code downloaded');
        }, 'image/png');
        
        URL.revokeObjectURL(svgUrl);
      };
      img.onerror = () => {
        onError('Error loading QR code');
        URL.revokeObjectURL(svgUrl);
      };
      img.src = svgUrl;
    } catch (e) {
      onError('Error downloading QR code');
    }
  };

  if (!isOpen) return null;

  const shareData = getShareData();

  return (
    <div className="modal modal-open">
      <div className="modal-box max-w-md">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">Share Calculation</h3>
          <button 
            className="btn btn-sm btn-circle btn-ghost" 
            onClick={onClose}
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {!shareOption ? (
          <div className="space-y-4">
            <p className="text-sm opacity-75">
              Choose an option to share your calculation:
            </p>
            <div className="space-y-2">
              <button
                className="btn btn-outline w-full justify-start"
                onClick={() => setShareOption('qr')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h2M4 4h4m0 0v4m0 0h4m0 0V4M8 8h.01M20 8h.01M8 20h.01M20 20h.01" />
                </svg>
                Create Link with Calculation
              </button>
              <button
                className="btn btn-outline w-full justify-start opacity-50"
                disabled
                title="Will be available in a future update"
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF (coming soon)
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShareOption(null)}
                aria-label="Back"
              >
                ←
              </button>
              <span className="font-semibold">QR Code</span>
            </div>

            <div className="text-center space-y-4">
              <div 
                ref={qrRef}
                className="inline-block p-4 bg-white rounded-lg"
              >
                <QRCode
                  size={200}
                  value={shareData}
                  level="M"
                />
              </div>
              
              <p className="text-sm opacity-75">
                Scan this QR code to open the app with the calculation
              </p>

              <div className="flex gap-2">
                <button
                  className="btn btn-primary flex-1"
                  onClick={downloadQRCode}
                >
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Download QR Code
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}