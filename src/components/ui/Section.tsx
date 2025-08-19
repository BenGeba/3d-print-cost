import { SectionProps } from '../../types';
import {CARD_CLASS} from "../../constants";

export function Section({ title, children, aside }: SectionProps) {
  return (
    <div className={CARD_CLASS}>
      <div className="card-body">
        <div className="flex items-start justify-between gap-4 mb-4">
          <h2 className="text-lg font-semibold">{title}</h2>
          {aside}
        </div>
        <div className="space-y-4">{children}</div>
      </div>
    </div>
  );
}