
import React, { ReactNode } from 'react';
import Card, { CardContent, CardHeader, CardTitle, CardFooter } from './Card';
import Button from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerContent?: ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footerContent }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm" onClick={onClose}>
      <Card className="w-11/12 max-w-md" onClick={(e) => e.stopPropagation()}>
        <CardHeader>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          {children}
        </CardContent>
        {footerContent && (
            <CardFooter>
                {footerContent}
            </CardFooter>
        )}
      </Card>
    </div>
  );
};

export default Modal;
