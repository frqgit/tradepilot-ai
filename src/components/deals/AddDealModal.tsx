'use client';

import { useState } from 'react';
import { Button, Input, Select, Modal } from '@/components/ui';

interface AddDealModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const transmissionOptions = [
  { value: '', label: 'Select transmission' },
  { value: 'AUTOMATIC', label: 'Automatic' },
  { value: 'MANUAL', label: 'Manual' },
  { value: 'CVT', label: 'CVT' },
  { value: 'DCT', label: 'DCT' },
  { value: 'OTHER', label: 'Other' },
];

const fuelTypeOptions = [
  { value: '', label: 'Select fuel type' },
  { value: 'PETROL', label: 'Petrol' },
  { value: 'DIESEL', label: 'Diesel' },
  { value: 'HYBRID', label: 'Hybrid' },
  { value: 'ELECTRIC', label: 'Electric' },
  { value: 'LPG', label: 'LPG' },
  { value: 'OTHER', label: 'Other' },
];

const bodyTypeOptions = [
  { value: '', label: 'Select body type' },
  { value: 'SEDAN', label: 'Sedan' },
  { value: 'HATCHBACK', label: 'Hatchback' },
  { value: 'SUV', label: 'SUV' },
  { value: 'WAGON', label: 'Wagon' },
  { value: 'UTE', label: 'Ute' },
  { value: 'COUPE', label: 'Coupe' },
  { value: 'CONVERTIBLE', label: 'Convertible' },
  { value: 'VAN', label: 'Van' },
  { value: 'OTHER', label: 'Other' },
];

export default function AddDealModal({ isOpen, onClose, onSuccess }: AddDealModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    sourceUrl: '',
    sourceSite: '',
    year: '',
    make: '',
    model: '',
    variant: '',
    odometer: '',
    transmission: '',
    fuelType: '',
    bodyType: '',
    colour: '',
    askPrice: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/deals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sourceUrl: formData.sourceUrl || undefined,
          sourceSite: formData.sourceSite || undefined,
          askPrice: formData.askPrice ? parseFloat(formData.askPrice) : undefined,
          vehicle: {
            year: parseInt(formData.year),
            make: formData.make,
            model: formData.model,
            variant: formData.variant || undefined,
            odometer: formData.odometer ? parseInt(formData.odometer) : undefined,
            transmission: formData.transmission || undefined,
            fuelType: formData.fuelType || undefined,
            bodyType: formData.bodyType || undefined,
            colour: formData.colour || undefined,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to create deal');
        return;
      }

      onSuccess();
      onClose();
      // Reset form
      setFormData({
        sourceUrl: '',
        sourceSite: '',
        year: '',
        make: '',
        model: '',
        variant: '',
        odometer: '',
        transmission: '',
        fuelType: '',
        bodyType: '',
        colour: '',
        askPrice: '',
      });
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Add New Deal" size="lg">
      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Source Info */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Source</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="sourceUrl"
              label="Listing URL"
              value={formData.sourceUrl}
              onChange={handleChange}
              placeholder="https://carsales.com.au/..."
            />
            <Input
              name="sourceSite"
              label="Source Site"
              value={formData.sourceSite}
              onChange={handleChange}
              placeholder="Carsales, Facebook, etc."
            />
          </div>
        </div>

        {/* Vehicle Info */}
        <div>
          <h4 className="text-sm font-medium text-slate-700 mb-3">Vehicle Details</h4>
          <div className="grid grid-cols-2 gap-4">
            <Input
              name="year"
              label="Year *"
              type="number"
              value={formData.year}
              onChange={handleChange}
              placeholder="2020"
              required
            />
            <Input
              name="make"
              label="Make *"
              value={formData.make}
              onChange={handleChange}
              placeholder="Toyota"
              required
            />
            <Input
              name="model"
              label="Model *"
              value={formData.model}
              onChange={handleChange}
              placeholder="Camry"
              required
            />
            <Input
              name="variant"
              label="Variant"
              value={formData.variant}
              onChange={handleChange}
              placeholder="SL Hybrid"
            />
            <Input
              name="odometer"
              label="Odometer (km)"
              type="number"
              value={formData.odometer}
              onChange={handleChange}
              placeholder="45000"
            />
            <Input
              name="colour"
              label="Colour"
              value={formData.colour}
              onChange={handleChange}
              placeholder="White"
            />
            <Select
              name="transmission"
              label="Transmission"
              value={formData.transmission}
              onChange={handleChange}
              options={transmissionOptions}
            />
            <Select
              name="fuelType"
              label="Fuel Type"
              value={formData.fuelType}
              onChange={handleChange}
              options={fuelTypeOptions}
            />
            <Select
              name="bodyType"
              label="Body Type"
              value={formData.bodyType}
              onChange={handleChange}
              options={bodyTypeOptions}
            />
            <Input
              name="askPrice"
              label="Asking Price"
              type="number"
              value={formData.askPrice}
              onChange={handleChange}
              placeholder="25000"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" loading={loading}>
            Add Deal
          </Button>
        </div>
      </form>
    </Modal>
  );
}
