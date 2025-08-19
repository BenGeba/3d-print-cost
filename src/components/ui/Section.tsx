import { SectionProps } from '../../types';

export function Section({ title, children, aside }: SectionProps) {
  return (
    <div className="card bg-base-100 shadow">
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