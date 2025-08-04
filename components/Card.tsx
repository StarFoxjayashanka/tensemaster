import React from 'react';

const Card: React.FC<{ children: React.ReactNode; className?: string } & React.HTMLAttributes<HTMLDivElement>> = ({ children, className = '', ...props }) => {
  return (
    <div className={`tense-master-card rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-lg shadow-black/20 ${className}`} {...props}>
      {children}
    </div>
  );
};

export const CardHeader: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`flex flex-col space-y-1.5 p-6 ${className}`}>{children}</div>;
};

export const CardTitle: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <h3 className={`text-2xl font-semibold leading-none tracking-tight ${className}`}>{children}</h3>;
};

export const CardDescription: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <p className={`text-sm text-muted-foreground ${className}`}>{children}</p>;
};

export const CardContent: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`p-6 pt-0 ${className}`}>{children}</div>;
};

export const CardFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => {
  return <div className={`flex items-center p-6 pt-0 ${className}`}>{children}</div>;
};

export default Card;