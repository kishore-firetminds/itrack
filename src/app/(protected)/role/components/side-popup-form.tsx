// side-popup-form.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { X, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type FormField =
  | { key: string; label: string; type: 'text'; required?: boolean }
  | { key: string; label: string; type: 'toggle' };

type SidePopupFormProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  fields: FormField[];
  defaultValues?: Record<string, any>;
  onSubmit: (data: Record<string, any>) => void;
};

export function SidePopupForm({
  isOpen,
  onClose,
  title,
  fields,
  defaultValues = {},
  onSubmit,
}: SidePopupFormProps) {
  const [formValues, setFormValues] = useState<Record<string, any>>(defaultValues);

  useEffect(() => {
    if (isOpen) setFormValues(defaultValues);
  }, [isOpen, defaultValues]);

  const handleChange = (key: string, value: any) => {
    setFormValues((prev) => ({ ...prev, [key]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formValues);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-100 flex justify-end bg-black/30">
      <div className="relative w-96 h-full bg-white shadow-xl flex flex-col ">
        {/* Header with buttons */}
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">{title}</h2>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 rounded-full border-2 hover:bg-red-50 hover:border-red-300 bg-transparent"
            >
              <X className="h-4 w-4 text-red-600" />
            </Button>
            <Button
              type="submit"
              size="sm"
              onClick={handleFormSubmit}
              className="h-8 w-8 p-0 rounded-full bg-green-600 hover:bg-green-700"
            >
              <Check className="h-4 w-4 text-white" />
            </Button>
          </div>
        </div>

        {/* Form Fields */}
        <form
          className="p-4 flex-1 overflow-y-auto space-y-4"
          onSubmit={handleFormSubmit}
        >
          {fields.map((field) => (
            <div key={field.key} className="flex flex-col">
              <Label htmlFor={field.key} className="mb-1">
                {field.label}
              </Label>

              {field.type === 'text' && (
                <Input
                  id={field.key}
                  value={formValues[field.key] ?? ''}
                  onChange={(e) => handleChange(field.key, e.target.value)}
                  required={field.required}
                />
              )}

              {field.type === 'toggle' && (
                <div
                  onClick={() =>
                    handleChange(field.key, !formValues[field.key])
                  }
                  className={cn(
                    'w-12 h-6 flex items-center rounded-full p-1 cursor-pointer',
                    formValues[field.key] ? 'bg-green-500' : 'bg-gray-300'
                  )}
                >
                  <div
                    className={cn(
                      'bg-white w-4 h-4 rounded-full shadow-md transform duration-300',
                      formValues[field.key] ? 'translate-x-6' : ''
                    )}
                  />
                </div>
              )}
            </div>
          ))}
        </form>
      </div>
    </div>
  );
}
