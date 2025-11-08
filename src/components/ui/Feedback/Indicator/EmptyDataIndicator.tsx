import React from 'react';

export type EmptyDataSize = 'sm' | 'md' | 'lg';

export type EmptyDataProps = {
  title: React.ReactNode;
  description?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
  size?: EmptyDataSize;
  role?: 'status' | 'region' | string;
  headingLevel?: 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
};

const sizeMap: Record<EmptyDataSize, string> = {
  sm: 'py-6 px-4 text-sm',
  md: 'py-8 px-6 text-base',
  lg: 'py-12 px-8 text-lg',
};

function EmptyDataIndicator({
  title,
  description,
  icon,
  action,
  className,
  size = 'md',
  role = 'status',
  headingLevel = 'h3',
}: EmptyDataProps) {
  const Heading = headingLevel as any;

  return (
    <div
      className={[
        'thoth-emptydata flex flex-col items-center text-center text-muted-foreground',
        sizeMap[size],
        className || '',
      ].join(' ')}
      role={role}
      aria-live={role === 'status' ? 'polite' : undefined}
    >
      {icon ? <div className="thoth-emptydata-icon mb-4">{icon}</div> : null}

      <div className="thoth-emptydata-content max-w-xl">
        <Heading className="thoth-emptydata-title text-2xl font-semibold text-foreground">
          {title}
        </Heading>

        {description ? (
          <p className="thoth-emptydata-description mt-2 text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}

        {action ? <div className="thoth-emptydata-action mt-6">{action}</div> : null}
      </div>
    </div>
  );
}

export default EmptyDataIndicator;
export { EmptyDataIndicator };
