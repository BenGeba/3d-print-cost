import { FieldProps } from '../../types';
import { LABEL_CLASS, SUBTLE } from '../../constants';

export function Field({ label, suffix, children, hint, error, tip }: FieldProps) {
  return (
    <div>
      <label className={LABEL_CLASS}>
        <span className="inline-flex items-center gap-2">
          {label}
          {tip && (
            <span className="tooltip" data-tip={tip}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4 opacity-70">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 8a1 1 0 112 0v5a1 1 0 11-2 0V8zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </span>
      </label>
      {children}
      {error && <p className="text-error text-xs mt-1">{error}</p>}
      <div className="flex items-center gap-2 mt-1">
        {suffix && <span className={SUBTLE}>{suffix}</span>}
        {hint && <span className={SUBTLE}>{hint}</span>}
      </div>
    </div>
  );
}