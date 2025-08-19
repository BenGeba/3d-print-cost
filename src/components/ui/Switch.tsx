import { SwitchProps } from '../../types';
import { forwardRef, useId } from "react";

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
    (
        {
            checked,
            onChange,
            labelLeft,
            labelRight,
            name,
        },
        ref
    ) => {
        const id = useId();
        const leftId = labelLeft ? `${id}-left` : undefined;
        const rightId = labelRight ? `${id}-right` : undefined;
        const ariaLabelledBy = [leftId, rightId].filter(Boolean).join(" ") || undefined;

        return (
            <div className="inline-flex items-center gap-3">
                {labelLeft && (
                    <span id={leftId} className="text-sm">
            {labelLeft}
          </span>
                )}

                <label htmlFor={id} className="inline-flex items-center">
                    <input
                        id={id}
                        ref={ref}
                        type="checkbox"
                        name={name}
                        className={`toggle toggle-md toggle-primary`}
                        checked={checked}
                        aria-checked={checked}
                        aria-labelledby={ariaLabelledBy}
                        onChange={(e) => onChange(e.target.checked)}
                    />
                </label>

                {labelRight && (
                    <span id={rightId} className="text-sm">
            {labelRight}
          </span>
                )}
            </div>
        );
    }
);