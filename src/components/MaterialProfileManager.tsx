import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowDownOnSquareIcon, PencilIcon, TrashIcon, PlusIcon, XMarkIcon } from "@heroicons/react/24/outline";
import { MaterialProfile } from "../types";
import { INPUT_CLASS, CARD_CLASS } from "../constants";
import { number, parseInput } from "../utils";

interface MaterialProfileManagerProps {
  profiles: MaterialProfile[];
  onAddProfile: (profile: Omit<MaterialProfile, 'id' | 'createdAt' | 'updatedAt' | 'costPerGram'>) => void;
  onEditProfile: (id: string, updates: Partial<MaterialProfile>) => void;
  onDeleteProfile: (id: string) => void;
  onSelectProfile: (profile: MaterialProfile) => void;
}

export default function MaterialProfileManager({
  profiles,
  onAddProfile,
  onEditProfile,
  onDeleteProfile,
  onSelectProfile
}: MaterialProfileManagerProps) {
  const { t } = useTranslation();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<Partial<MaterialProfile>>({
    name: '',
    materialType: 'PLA',
    brand: '',
    color: '',
    pricePerKg: '',
    totalSpoolWeight: '',
    emptySpoolWeight: '',
    filamentWeight: '',
    density: '1.24',
    diameter: '1.75',
    url: ''
  });

  const calculateCostPerGram = () => {
    const priceKg = number(formData.pricePerKg, 0);
    const filamentWt = number(formData.filamentWeight, 0);
    if (priceKg > 0 && filamentWt > 0) {
      // Convert price per kg to price per gram
      return priceKg / 1000;
    }
    return 0;
  };

  const calculateFilamentWeight = () => {
    const totalWt = number(formData.totalSpoolWeight, 0);
    const emptyWt = number(formData.emptySpoolWeight, 0);
    if (totalWt > 0 && emptyWt > 0 && totalWt > emptyWt) {
      return totalWt - emptyWt;
    }
    return 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const filamentWeight = formData.filamentWeight || calculateFilamentWeight();
    const costPerGram = calculateCostPerGram();

    const profileData = {
      ...formData,
      filamentWeight,
      costPerGram
    } as Omit<MaterialProfile, 'id' | 'createdAt' | 'updatedAt' | 'costPerGram'> & { costPerGram: number };

    if (editingId) {
      onEditProfile(editingId, { ...profileData, updatedAt: new Date() });
    } else {
      onAddProfile(profileData);
    }

    resetForm();
  };

  const resetForm = () => {
    setFormData({
      name: '',
      materialType: 'PLA',
      brand: '',
      color: '',
      pricePerKg: '',
      totalSpoolWeight: '',
      emptySpoolWeight: '',
      filamentWeight: '',
      density: '1.24',
      diameter: '1.75',
      url: ''
    });
    setShowForm(false);
    setEditingId(null);
  };

  const startEdit = (profile: MaterialProfile) => {
    setFormData(profile);
    setEditingId(profile.id);
    setShowForm(true);
  };

  const handleInputChange = (field: keyof MaterialProfile, value: string) => {
    const updatedData = { ...formData, [field]: parseInput(value) };
    
    // Auto-calculate filament weight if total and empty weights are provided
    if (field === 'totalSpoolWeight' || field === 'emptySpoolWeight') {
      const totalWt = number(field === 'totalSpoolWeight' ? value : formData.totalSpoolWeight, 0);
      const emptyWt = number(field === 'emptySpoolWeight' ? value : formData.emptySpoolWeight, 0);
      if (totalWt > 0 && emptyWt > 0 && totalWt > emptyWt) {
        updatedData.filamentWeight = totalWt - emptyWt;
      }
    }
    
    setFormData(updatedData);
  };

  return (
    <div className={CARD_CLASS}>
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold">{t('profiles.title', 'Material Profile')}</h3>
        <div className="lg:tooltip lg:tooltip-bottom" data-tip={showForm ? t('buttons.cancel', 'Abbrechen') : t('buttons.newProfile', 'Neues Profil')}>
          <button
            className="btn btn-soft btn-primary"
            onClick={() => setShowForm(!showForm)}
            aria-label={showForm ? t('aria.cancelForm', 'Formular abbrechen') : t('aria.createNewProfile', 'Neues Profil erstellen')}
          >
            {showForm ? <XMarkIcon className="w-5 h-5" /> : <PlusIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="space-y-4 mb-6 border-t pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">
                <span className="label-text">{t('fields.profileName', 'Name des Profils')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.materialType', 'Materialtyp')} *</span>
              </label>
              <select
                className={INPUT_CLASS}
                value={formData.materialType}
                onChange={(e) => setFormData({ ...formData, materialType: e.target.value })}
                required
              >
                <option value="PLA">PLA</option>
                <option value="PETG">PETG</option>
                <option value="ABS">ABS</option>
                <option value="TPU">TPU</option>
                <option value="WOOD">WOOD</option>
                <option value="CARBON">CARBON</option>
                <option value="OTHER">{t('materials.other', 'Andere')}</option>
              </select>
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.brand', 'Marke')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                placeholder={t('placeholders.brandExample', 'z.B. SUNLU, Bambu Lab, Polyterra')}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.color', 'Farbe')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                placeholder={t('placeholders.colorExample', 'z.B. Rot, Schwarz, Transparent')}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.pricePerKg', 'Preis pro KG (€)')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.pricePerKg}
                onChange={(e) => handleInputChange('pricePerKg', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.totalSpoolWeight', 'Gesamtgewicht Spule (g)')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.totalSpoolWeight}
                onChange={(e) => handleInputChange('totalSpoolWeight', e.target.value)}
                placeholder={t('placeholders.totalWeight', 'Spule + Filament')}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.emptySpoolWeight', 'Leergewicht Spule (g)')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.emptySpoolWeight}
                onChange={(e) => handleInputChange('emptySpoolWeight', e.target.value)}
                placeholder={t('placeholders.emptyWeight', 'Nur die leere Spule')}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.filamentWeight', 'Filamentgewicht (g)')}</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.filamentWeight}
                onChange={(e) => handleInputChange('filamentWeight', e.target.value)}
                placeholder={t('placeholders.autoCalculated', 'Wird automatisch berechnet')}
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.density', 'Dichte (g/cm³)')} *</span>
              </label>
              <input
                type="text"
                className={INPUT_CLASS}
                value={formData.density}
                onChange={(e) => handleInputChange('density', e.target.value)}
                required
              />
            </div>

            <div>
              <label className="label">
                <span className="label-text">{t('fields.diameter', 'Durchmesser (mm)')} *</span>
              </label>
              <select
                className={INPUT_CLASS}
                value={formData.diameter}
                onChange={(e) => setFormData({ ...formData, diameter: e.target.value })}
                required
              >
                <option value="1.75">1.75</option>
                <option value="3.0">3.0</option>
              </select>
            </div>

            <div className="md:col-span-2">
              <label className="label">
                <span className="label-text">{t('fields.url', 'URL')} ({t('common.optional', 'Optional')})</span>
              </label>
              <input
                type="url"
                className={INPUT_CLASS}
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder={t('placeholders.urlExample', 'Link zum Shop oder Produktseite')}
              />
            </div>
          </div>

          {(formData.pricePerKg && formData.filamentWeight) && (
            <div className="alert alert-info">
              <span>{t('info.costPerGram', 'Kosten pro Gramm')}: {calculateCostPerGram().toFixed(2)} €/g</span>
            </div>
          )}

          <div className="flex gap-2">
            <button type="submit" className="btn btn-soft btn-primary">
              {editingId ? t('buttons.updateProfile', 'Profil aktualisieren') : t('buttons.createProfile', 'Profil erstellen')}
            </button>
            <button type="button" className="btn btn-soft btn-ghost" onClick={resetForm}>
              {t('buttons.cancel', 'Abbrechen')}
            </button>
          </div>
        </form>
      )}

      <div className="space-y-2">
        <h4 className="font-medium">{t('profiles.savedProfiles', 'Gespeicherte Profile')} ({profiles.length})</h4>
        {profiles.length === 0 ? (
          <p className="text-base-content/70 text-sm">{t('profiles.noProfiles', 'Noch keine Profile erstellt')}</p>
        ) : (
          <div className="grid gap-2">
            {profiles.map((profile) => (
              <div key={profile.id} className="flex items-center justify-between bg-base-200 p-3 rounded">
                <div className="flex-1">
                  <div className="font-medium">
                    {profile.name} ({profile.materialType})
                  </div>
                  <div className="text-sm text-base-content/70">
                    {profile.brand} • {profile.color} • {number(profile.costPerGram, 2).toFixed(2)} €/g
                  </div>
                </div>
                <div className="flex gap-1">
                  <div className="lg:tooltip lg:tooltip-bottom" data-tip={t('buttons.load', 'Laden')}>
                    <button
                      className="btn btn-soft btn-primary btn-sm"
                      onClick={() => onSelectProfile(profile)}
                      aria-label={t('aria.loadProfile', 'Profil laden')}
                    >
                      <ArrowDownOnSquareIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="lg:tooltip lg:tooltip-bottom" data-tip={t('buttons.edit', 'Bearbeiten')}>
                    <button
                      className="btn btn-soft btn-secondary btn-sm"
                      onClick={() => startEdit(profile)}
                      aria-label={t('aria.editProfile', 'Profil bearbeiten')}
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="lg:tooltip lg:tooltip-bottom" data-tip={t('buttons.delete', 'Löschen')}>
                    <button
                      className="btn btn-soft btn-error btn-sm"
                      onClick={() => onDeleteProfile(profile.id)}
                      aria-label={t('aria.deleteProfile', 'Profil löschen')}
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}