import { FieldProps } from '../../types';
import { LABEL_CLASS, SUBTLE } from '../../constants';
import { useEffect, useRef } from 'react';

export function Field({ label, suffix, children, hint, error, tip }: FieldProps) {
  const fieldRef = useRef<HTMLDivElement>(null);
  const prevErrorRef = useRef<string | undefined>(error);

  useEffect(() => {
    const prevError = prevErrorRef.current;
    const currentError = error;
    
    if (fieldRef.current) {
      // Error state animation
      if (currentError && currentError !== prevError) {
        fieldRef.current.classList.add('field-error-enter');
        setTimeout(() => {
          fieldRef.current?.classList.remove('field-error-enter');
        }, 500);
      }
      
      // Success state animation (when error is cleared)
      if (prevError && !currentError) {
        fieldRef.current.classList.add('field-success-enter');
        setTimeout(() => {
          fieldRef.current?.classList.remove('field-success-enter');
        }, 600);
      }
    }
    
    prevErrorRef.current = currentError;
  }, [error]);

  return (
    <div 
      ref={fieldRef}
      className={`field transition-all duration-300 ${error ? 'field-error' : 'field-valid'}`}
    >
      <label className={`${LABEL_CLASS} transition-colors duration-200`}>
        <span className="inline-flex items-center gap-2">
          {label}
          {tip && (
            <span 
              className="tooltip transition-all duration-200 hover:scale-110" 
              data-tip={tip}
            >
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                viewBox="0 0 20 20" 
                fill="currentColor" 
                className="w-4 h-4 opacity-70 hover:opacity-100 transition-opacity duration-200"
              >
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM9 8a1 1 0 112 0v5a1 1 0 11-2 0V8zm1-4a1.5 1.5 0 100 3 1.5 1.5 0 000-3z" clipRule="evenodd" />
              </svg>
            </span>
          )}
        </span>
      </label>
      
      <div className="relative">
        {children}
        {error && (
          <div className="absolute inset-0 pointer-events-none rounded-lg opacity-20 bg-error animate-pulse"></div>
        )}
      </div>
      
      {error && (
        <p className="text-error text-xs mt-1 animate-in slide-in-from-top-1 duration-300">
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            viewBox="0 0 20 20" 
            fill="currentColor" 
            className="w-3 h-3 inline mr-1"
          >
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
          </svg>
          {error}
        </p>
      )}
      
      <div className="flex items-center gap-2 mt-1 transition-opacity duration-200">
        {suffix && <span className={`${SUBTLE} transition-colors duration-200`}>{suffix}</span>}
        {hint && <span className={`${SUBTLE} transition-colors duration-200`}>{hint}</span>}
      </div>
    </div>
  );
}