import { useTranslation } from 'react-i18next';
import MaterialProfileManager from '../MaterialProfileManager';
import { MaterialProfile } from '../../types';
import { CARD_CLASS } from '../../constants';

interface MaterialProfilesPageProps {
  materialProfiles: {
    profiles: MaterialProfile[];
    addProfile: (profileData: Omit<MaterialProfile, 'id' | 'createdAt' | 'updatedAt' | 'costPerGram'>) => MaterialProfile;
    updateProfile: (id: string, updates: Partial<MaterialProfile>) => void;
    deleteProfile: (id: string) => void;
    getProfile: (id: string) => MaterialProfile | undefined;
    duplicateProfile: (id: string, newName?: string) => MaterialProfile | null;
  };
  onLoadProfile?: (profile: MaterialProfile, filamentId?: string) => void;
  pushToast?: (kind: 'success' | 'error' | 'info', message: string, ms?: number, actionLabel?: string, actionFn?: () => void) => void;
}

export default function MaterialProfilesPage({ materialProfiles, onLoadProfile, pushToast }: MaterialProfilesPageProps) {
  const { t } = useTranslation();

  const handleLoadProfile = (profile: MaterialProfile, filamentId?: string) => {
    if (onLoadProfile) {
      onLoadProfile(profile, filamentId);
    }
    if (pushToast) {
      pushToast('success', t('messages.profileLoaded', `Profile "${profile.name}" loaded successfully`));
    }
  };

  return (
    <div className="min-h-screen bg-base-200 text-base-content transition-colors">
      <div className="max-w-5xl mx-auto px-4 py-8 md:py-12 pb-20 lg:pb-8">
        {/* Header */}
        <div className={`${CARD_CLASS} mb-6`}>
          <div className="text-center">
            <h1 className="text-3xl font-bold text-primary mb-2">
              {t('pages.profiles.title', 'Material Profiles')}
            </h1>
            <p className="text-base-content/70">
              {t('pages.profiles.description', 'Manage your filament material profiles for quick access to pricing and specifications.')}
            </p>
          </div>
        </div>

        {/* Material Profile Manager */}
        <div className="space-y-6">
          <MaterialProfileManager
            profiles={materialProfiles.profiles}
            onAddProfile={materialProfiles.addProfile}
            onEditProfile={materialProfiles.updateProfile}
            onDeleteProfile={materialProfiles.deleteProfile}
            onSelectProfile={handleLoadProfile}
          />

          {/* Tips and Information */}
          <div className={CARD_CLASS}>
            <h2 className="text-lg font-semibold mb-3 text-secondary">
              {t('pages.profiles.tips.title', 'Profile Management Tips')}
            </h2>
            <ul className="list-disc pl-5 space-y-2 text-sm">
              <li>
                {t('pages.profiles.tips.accurate', 'Keep your profiles accurate by weighing empty spools and noting exact purchase prices.')}
              </li>
              <li>
                {t('pages.profiles.tips.brands', 'Create separate profiles for different brands as prices and densities can vary significantly.')}
              </li>
              <li>
                {t('pages.profiles.tips.colors', 'Some colors (like metallic or transparent) may have different densities than standard colors.')}
              </li>
              <li>
                {t('pages.profiles.tips.updates', 'Update profiles when prices change to maintain accurate cost calculations.')}
              </li>
              <li>
                {t('pages.profiles.tips.urls', 'Include purchase URLs to quickly reorder materials when running low.')}
              </li>
            </ul>
          </div>

          {/* Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="stat bg-base-100 rounded-box border border-base-300">
              <div className="stat-title text-primary">{t('stats.totalProfiles', 'Total Profiles')}</div>
              <div className="stat-value text-2xl">{materialProfiles.profiles.length}</div>
            </div>
            
            <div className="stat bg-base-100 rounded-box border border-base-300">
              <div className="stat-title text-secondary">{t('stats.materialTypes', 'Material Types')}</div>
              <div className="stat-value text-2xl">
                {new Set(materialProfiles.profiles.map(p => p.materialType)).size}
              </div>
            </div>
            
            <div className="stat bg-base-100 rounded-box border border-base-300">
              <div className="stat-title text-accent">{t('stats.brands', 'Brands')}</div>
              <div className="stat-value text-2xl">
                {new Set(materialProfiles.profiles.map(p => p.brand)).size}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}