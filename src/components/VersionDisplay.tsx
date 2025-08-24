import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VersionDisplayProps {
  className?: string;
}

export default function VersionDisplay({ className = '' }: VersionDisplayProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  
  // Get version from environment variables injected by Vite
  const version = import.meta.env.VITE_APP_VERSION || '1.0.0';
  
  // Get build timestamp from environment or use current date as fallback
  const buildDate = import.meta.env.VITE_BUILD_DATE || new Date().toISOString().split('T')[0];
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs text-base-content/60 hover:text-base-content/80 transition-colors cursor-pointer"
        title={t('pwa.showVersion')}
      >
        v{version}
      </button>
      
      {showDetails && (
        <div className="absolute bottom-full mb-2 p-2 bg-base-100 border border-base-300 rounded-lg shadow-lg text-xs whitespace-nowrap z-10">
          <div className="text-base-content/90">
            <div>Version: {version}</div>
            <div>Build: {buildDate}</div>
            {import.meta.env.VITE_GIT_SHA && (
              <div>Commit: {import.meta.env.VITE_GIT_SHA.substring(0, 7)}</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}