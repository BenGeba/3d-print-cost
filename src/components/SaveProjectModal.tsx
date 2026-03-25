import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';

interface SaveProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string) => void;
}

function defaultName(): string {
  const d = new Date();
  const pad = (n: number) => String(n).padStart(2, '0');
  return `Kalkulation - ${pad(d.getDate())}.${pad(d.getMonth() + 1)}.${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function SaveProjectModal({ isOpen, onClose, onSave }: SaveProjectModalProps) {
  const { t } = useTranslation();
  const [name, setName] = useState('');

  useEffect(() => {
    if (isOpen) setName(defaultName());
  }, [isOpen]);

  function handleSave() {
    if (!name.trim()) return;
    onSave(name.trim());
    onClose();
  }

  if (!isOpen) return null;

  return (
    <div className="modal modal-open">
      <div className="modal-box">
        <h3 className="font-bold text-lg mb-4">{t('history.saveTitle')}</h3>
        <input
          className="input input-bordered w-full"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSave()}
          autoFocus
        />
        <div className="modal-action">
          <button className="btn btn-ghost" onClick={onClose}>
            {t('buttons.cancel')}
          </button>
          <button
            className="btn btn-primary"
            onClick={handleSave}
            disabled={!name.trim()}
          >
            {t('buttons.saveProject')}
          </button>
        </div>
      </div>
      <div className="modal-backdrop" onClick={onClose} />
    </div>
  );
}
