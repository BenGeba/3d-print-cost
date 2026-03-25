import { useState } from 'react';
import { useTranslation } from 'react-i18next';

interface VersionDisplayProps {
  className?: string;
}

export default function VersionDisplay({ className = '' }: VersionDisplayProps) {
  const { t } = useTranslation();
  const [showDetails, setShowDetails] = useState(false);
  
  // Get version from global constants injected by Vite define
  const version = __APP_VERSION__;
  const buildDate = __BUILD_DATE__;
  
  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <button
        onClick={() => setShowDetails(!showDetails)}
        className="text-xs hover:text-base-content/80 transition-colors cursor-pointer"
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