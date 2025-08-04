
import React from 'react';

const Footer: React.FC = () => {
  return (
    <footer className="py-6 md:px-8 md:py-0 bg-background border-t">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-sm leading-loose text-center text-muted-foreground md:text-left">
          © {new Date().getFullYear()} Tense Master AI. All Rights Reserved.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
