import { SwitchProps } from '../../types';
import { SUBTLE } from '../../constants';

export function Switch({ checked, onChange, labelLeft, labelRight }: SwitchProps) {
  return (
    <div className="flex items-center gap-3">
      {labelLeft && <span className={SUBTLE}>{labelLeft}</span>}
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-all ${
          checked ? "bg-gray-900" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
            checked ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
      {labelRight && <span className={SUBTLE}>{labelRight}</span>}
    </div>
  );
}