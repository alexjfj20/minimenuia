'use client';

import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={`sm:max-w-lg ${className || ''}`}>
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-gray-900">{title}</DialogTitle>
          {description && (
            <DialogDescription className="text-gray-500">{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="mt-4">
          {children}
        </div>
      </DialogContent>
    </Dialog>
  );
}
