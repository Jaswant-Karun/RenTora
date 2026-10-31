import React from 'react';
import { Resource } from '../../types/resource';
import { BookingWizardModal } from '../booking/BookingWizardModal';

interface BookingModalProps {
  isOpen: boolean;
  resource: Resource | null;
  onClose: () => void;
  onSuccess?: () => void;
}

export const BookingModal: React.FC<BookingModalProps> = ({
  isOpen,
  resource,
  onClose,
  onSuccess,
}) => {
  if (!isOpen || !resource) return null;

  return (
    <BookingWizardModal
      resource={resource}
      isOpen={isOpen}
      onClose={onClose}
      onSuccess={onSuccess || (() => {})}
    />
  );
};
