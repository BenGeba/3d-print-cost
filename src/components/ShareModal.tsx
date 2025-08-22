import { useState, useRef } from 'react';
import QRCode from 'react-qrcode-logo';
import { AppState } from '../types';
import { generateShareUrl } from '../utils';
import { useCalculations } from '../hooks';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  appState: AppState;
  onSuccess: (message: string) => void;
  onError: (message: string) => void;
}

export function ShareModal({ isOpen, onClose, appState, onSuccess, onError }: ShareModalProps) {
  const [shareOption, setShareOption] = useState<'qr' | 'pdf' | null>(null);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);
  const calculations = useCalculations(appState);

  // Generate shareable URL for QR code
  const getShareData = (): string => {
    try {
      return generateShareUrl(appState);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error creating share URL');
      return '';
    }
  };

  // Generate QR code as data URL for PDF
  const generateQRCodeDataUrl = async (): Promise<string> => {
    return new Promise((resolve, reject) => {
      console.log('🔄 Starting QR code generation for PDF');
      
      const waitForQRCode = () => {
        const elapsed = Date.now() - startTime;
        console.log(`⏱️ Waiting for QR code... (${elapsed}ms elapsed)`);
        
        if (!qrRef.current) {
          console.log('❌ qrRef.current is null');
          if (elapsed < 3000) {
            setTimeout(waitForQRCode, 100);
            return;
          }
          reject(new Error('QR code container not found after 3 seconds'));
          return;
        }

        console.log('✅ qrRef.current found, looking for Canvas...');
        const canvas = qrRef.current.querySelector('canvas');
        
        if (!canvas) {
          console.log('❌ Canvas not found in QR code container');
          console.log('Container innerHTML:', qrRef.current.innerHTML);
          console.log('Container children:', qrRef.current.children);
          
          if (elapsed < 3000) {
            setTimeout(waitForQRCode, 100);
            return;
          }
          reject(new Error('QR code Canvas not found after 3 seconds'));
          return;
        }

        console.log('✅ Canvas found, dimensions:', canvas.width, 'x', canvas.height);
        
        // Check if canvas has been drawn to
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }
        
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const hasContent = imageData.data.some(pixel => pixel !== 0);
        console.log('📊 Canvas has content:', hasContent);
        
        if (!hasContent && elapsed < 3000) {
          console.log('⚠️ Canvas found but appears empty, waiting longer...');
          setTimeout(waitForQRCode, 100);
          return;
        }

        // Found Canvas with content, convert to data URL
        try {
          console.log('🎨 Converting Canvas to data URL...');
          const dataUrl = canvas.toDataURL('image/png');
          console.log('✅ QR code converted to data URL, length:', dataUrl.length);
          resolve(dataUrl);
        } catch (error) {
          console.log('❌ Error processing QR code:', error);
          reject(new Error('Error processing QR code: ' + (error instanceof Error ? error.message : 'Unknown error')));
        }
      };

      const startTime = Date.now();
      // Add a small initial delay to ensure React has rendered
      setTimeout(waitForQRCode, 100);
    });
  };

  // Download QR code as PNG
  const downloadQRCode = async (): Promise<void> => {
    try {
      if (!qrRef.current) {
        onError('QR code not found');
        return;
      }

      const canvas = qrRef.current.querySelector('canvas');
      if (!canvas) {
        onError('QR code Canvas not found');
        return;
      }

      // Canvas is already rendered, convert directly to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          onError('Error creating PNG file');
          return;
        }

        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `3d-print-calculator-qr-${new Date().toISOString().slice(0, 10)}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        onSuccess('QR code downloaded');
      }, 'image/png');
    } catch (e) {
      onError('Error downloading QR code');
    }
  };

  // Generate and download PDF
  async function downloadPDF(): Promise<void> {
    try {
      setIsGeneratingPDF(true);
      
      // Generate QR code data URL
      const qrCodeDataUrl = await generateQRCodeDataUrl();
      
      // Dynamically import PDF dependencies
      const [
        { default: PDFDocument, ensureFontsRegistered }, 
        { pdf }
      ] = await Promise.all([
        import('./PDFDocument'),
        import('@react-pdf/renderer')
      ]);
      
      // Ensure fonts are registered before creating PDF
      await ensureFontsRegistered();
      
      const doc = <PDFDocument 
        appState={appState} 
        calculations={calculations} 
        qrCodeDataUrl={qrCodeDataUrl}
      />;
      
      // Generate PDF blob
      const blob = await pdf(doc).toBlob();
      
      // Download PDF
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `3d-print-calculation-${new Date().toISOString().slice(0, 10)}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      onSuccess('PDF downloaded successfully');
      setShareOption(null);
    } catch (e) {
      onError(e instanceof Error ? e.message : 'Error generating PDF');
    } finally {
      setIsGeneratingPDF(false);
    }
  }

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
                <svg className="w-5 h-5 mr-2" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M3 11h8V3H3v8zm2-6h4v4H5V5zM3 21h8v-8H3v8zm2-6h4v4H5v-4zM13 3v8h8V3h-8zm6 6h-4V5h4v4zM15 15h1v1h-1v-1zM13 13h1v1h-1v-1zM14 14h1v1h-1v-1zM15 13h1v1h-1v-1zM17 13h1v1h-1v-1zM19 13h1v1h-1v-1zM17 15h1v1h-1v-1zM19 15h1v1h-1v-1zM17 17h1v1h-1v-1zM19 17h1v1h-1v-1zM21 13h1v1h-1v-1zM21 15h1v1h-1v-1zM13 15h1v1h-1v-1zM13 17h1v1h-1v-1zM15 17h1v1h-1v-1zM13 19h1v1h-1v-1zM15 19h1v1h-1v-1zM17 19h1v1h-1v-1zM19 19h1v1h-1v-1zM21 17h1v1h-1v-1zM21 19h1v1h-1v-1zM13 21h1v1h-1v-1zM15 21h1v1h-1v-1zM17 21h1v1h-1v-1zM19 21h1v1h-1v-1zM21 21h1v1h-1v-1z"/>
                </svg>
                Create Link with Calculation
              </button>
              <button
                className="btn btn-outline w-full justify-start"
                onClick={() => setShareOption('pdf')}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Export PDF
              </button>
            </div>
          </div>
        ) : shareOption === 'qr' ? (
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
                  size={256}
                  value={shareData}
                  ecLevel="M"
                  qrStyle={"squares"}
                  logoImage="/logo.svg"
                  logoOpacity={0.8}
                  logoPaddingRadius={80}
                  logoPadding={4}
                  logoPaddingStyle={"circle"}
                  removeQrCodeBehindLogo={true}
                  enableCORS={true}
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
        ) : shareOption === 'pdf' ? (
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <button
                className="btn btn-sm btn-ghost"
                onClick={() => setShareOption(null)}
                aria-label="Back"
              >
                ←
              </button>
              <span className="font-semibold">Export PDF</span>
            </div>

            <div className="text-center space-y-4">
              <div className="p-8 border-2 border-dashed border-base-300 rounded-lg">
                <svg className="w-16 h-16 mx-auto mb-4 text-base-content opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h4 className="text-lg font-semibold mb-2">PDF Export</h4>
                <p className="text-sm opacity-75 mb-4">
                  Generate a comprehensive PDF report including all calculation details, cost breakdown, and a QR code to share your calculation.
                </p>
                <p className="text-xs opacity-60">
                  The PDF will include:
                </p>
                <ul className="text-xs opacity-60 list-disc list-inside mt-2 space-y-1">
                  <li>Complete cost breakdown</li>
                  <li>Print and filament details</li>
                  <li>QR code for easy sharing</li>
                  <li>Professional Nord theme styling</li>
                </ul>
              </div>

              <button
                className={`btn btn-primary w-full ${isGeneratingPDF ? 'loading' : ''}`}
                onClick={downloadPDF}
                disabled={isGeneratingPDF}
              >
                {isGeneratingPDF ? (
                  <>
                    <span className="loading loading-spinner loading-sm mr-2"></span>
                    Generating PDF...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Download PDF Report
                  </>
                )}
              </button>

              {/* Hidden QR code for PDF generation - positioned off-screen but still rendered */}
              <div 
                ref={qrRef}
                style={{
                  position: 'absolute',
                  left: '-9999px',
                  top: '-9999px',
                  visibility: 'hidden'
                }}
                className="bg-white p-2"
              >
                <QRCode
                  size={256}
                  value={shareData}
                  ecLevel="M"
                  qrStyle={"squares"}
                  logoImage="/logo.svg"
                  logoOpacity={0.8}
                  logoPaddingRadius={80}
                  logoPadding={4}
                  logoPaddingStyle={"circle"}
                  removeQrCodeBehindLogo={true}
                  enableCORS={true}
                />
              </div>
            </div>
          </div>
        ) : null}

        <div className="modal-action">
          <button className="btn" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  );
}