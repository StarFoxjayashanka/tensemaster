import React from 'react';
import Modal from './Modal';
import DynamicIcon, { iconNames } from './DynamicIcon';

interface IconPickerProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string) => void;
  currentIcon: string;
}

const IconPicker: React.FC<IconPickerProps> = ({ isOpen, onClose, onSelectIcon, currentIcon }) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Select an Icon">
      <div className="max-h-[60vh] overflow-y-auto">
        <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 gap-2">
          {iconNames.map(name => (
            <button
              key={name}
              onClick={() => {
                onSelectIcon(name);
                onClose();
              }}
              className={`flex items-center justify-center p-3 rounded-lg border-2 transition-colors ${
                currentIcon === name
                  ? 'bg-primary/20 border-primary'
                  : 'bg-secondary border-transparent hover:border-primary/50'
              }`}
              aria-label={`Select ${name} icon`}
            >
              <DynamicIcon name={name} className="w-6 h-6" />
            </button>
          ))}
        </div>
      </div>
    </Modal>
  );
};

export default IconPicker;