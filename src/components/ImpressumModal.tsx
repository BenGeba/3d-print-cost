import { useTranslation } from 'react-i18next';

interface ImpressumModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ImpressumModal({ isOpen, onClose }: ImpressumModalProps) {
  const { t } = useTranslation();

  if (!isOpen) return null;

  return (
    <dialog className="modal modal-open">
      <div className="modal-box max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">{t('impressum.title')}</h2>
          <button
            className="btn btn-ghost btn-sm btn-circle"
            onClick={onClose}
            aria-label={t('buttons.close')}
          >
            ✕
          </button>
        </div>

        <div className="prose prose-sm max-w-none dark:prose-invert">
          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('impressum.sections.contact')}</h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">{t('impressum.fields.name')}:</span><br />
                Benjamin Gebauer
              </p>
              <p>
                <span className="font-medium">{t('impressum.fields.address')}:</span><br />
                Fladderburger Str. 33<br />
                26219 Bösel<br />
                Deutschland
              </p>
              <p>
                <span className="font-medium">{t('impressum.fields.email')}:</span><br />
                3d@beng.dev
              </p>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('impressum.sections.disclaimer')}</h3>
            <div className="text-sm space-y-3">
              <div>
                <h4 className="font-medium mb-2">{t('impressum.disclaimer.contentLiability')}</h4>
                <p>{t('impressum.disclaimer.contentLiabilityText')}</p>
              </div>
              <div>
                <h4 className="font-medium mb-2">{t('impressum.disclaimer.linkLiability')}</h4>
                <p>{t('impressum.disclaimer.linkLiabilityText')}</p>
              </div>
            </div>
          </section>

          <section className="mb-8">
            <h3 className="text-lg font-semibold mb-4">{t('impressum.sections.appUsage')}</h3>
            <div className="text-sm space-y-3">
              <p>{t('impressum.appUsage.description')}</p>
              <p>{t('impressum.appUsage.noWarranty')}</p>
              <p>{t('impressum.appUsage.dataProcessing')}</p>
              <p>{t('impressum.appUsage.openSource')}</p>
            </div>
          </section>

        </div>

        <div className="modal-action mt-8 pt-6 border-t border-base-300">
          <button 
            className="btn btn-primary"
            onClick={onClose}
          >
            {t('buttons.close')}
          </button>
        </div>
      </div>
      
      <div className="modal-backdrop" onClick={onClose}>
        <button>{t('buttons.close')}</button>
      </div>
    </dialog>
  );
}