import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { SavedProject } from '../../types';
import { formatToCurrency } from '../../utils';

interface HistoryPageProps {
  projects: SavedProject[];
  onLoad: (project: SavedProject) => void;
  onDelete: (id: string) => void;
}

export default function HistoryPage({ projects, onLoad, onDelete }: HistoryPageProps) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  function formatDate(iso: string): string {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function handleLoad(project: SavedProject) {
    onLoad(project);
    navigate('/');
  }

  return (
    <div className="min-h-screen bg-base-200 text-base-content">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold mb-6">{t('history.title')}</h1>

        {projects.length === 0 ? (
          <div className="card bg-base-100 shadow p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="w-12 h-12 mx-auto mb-4 text-base-content/30"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 3H7a2 2 0 00-2 2v16l7-3 7 3V5a2 2 0 00-2-2z" />
            </svg>
            <p className="text-base-content/60">{t('history.empty')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((project) => (
              <div key={project.id} className="card bg-base-100 shadow border border-base-300 hover:shadow-md transition-shadow">
                <div className="card-body p-5">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <h2 className="font-semibold text-base leading-tight line-clamp-2">
                      {project.name}
                    </h2>
                    <span className={`badge badge-sm shrink-0 ${project.mode === 'business' ? 'badge-primary' : 'badge-ghost'}`}>
                      {t(`app.modes.${project.mode}`)}
                    </span>
                  </div>

                  <div className="text-2xl font-bold text-primary tabular-nums mb-1">
                    {formatToCurrency({
                      num: project.total,
                      currency: project.currency,
                      decimalPlaces: 2,
                      significantDecimalPlaces: 8,
                      locale: navigator.languages?.[0] || navigator.language || 'de-DE',
                    })}
                  </div>

                  <div className="text-xs text-base-content/50 mb-4">
                    {t('history.savedOn')} {formatDate(project.savedAt)}
                  </div>

                  <div className="flex gap-2">
                    <button
                      className="btn btn-soft btn-primary btn-sm flex-1"
                      onClick={() => handleLoad(project)}
                    >
                      {t('history.load')}
                    </button>
                    <button
                      className="btn btn-soft btn-error btn-sm"
                      onClick={() => onDelete(project.id)}
                      title={t('history.delete')}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                        <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                      </svg>
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
