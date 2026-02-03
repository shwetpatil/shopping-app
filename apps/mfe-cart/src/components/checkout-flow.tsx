'use client';

import { useState } from 'react';
import { CreditCard, Truck, Check } from 'lucide-react';

interface CheckoutFlowProps {
  onComplete?: (orderData: Record<string, unknown>) => void;
}

export function CheckoutFlow({ onComplete }: CheckoutFlowProps) {
  const [step, setStep] = useState(1);

  const steps = [
    { num: 1, name: 'Shipping', icon: Truck },
    { num: 2, name: 'Payment', icon: CreditCard },
    { num: 3, name: 'Review', icon: Check },
  ];

  return (
    <div className="rounded-lg border bg-white p-6">
      {/* Progress Steps */}
      <div className="mb-8 flex justify-between">
        {steps.map((s, idx) => (
          <div key={s.num} className="flex flex-1 items-center">
            <div className="flex flex-col items-center flex-1">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  step >= s.num
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-600'
                }`}
              >
                <s.icon className="h-5 w-5" />
              </div>
              <span className="mt-2 text-sm font-medium">{s.name}</span>
            </div>
            {idx < steps.length - 1 && (
              <div
                className={`h-1 flex-1 ${
                  step > s.num ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>

      {/* Step Content */}
      <div className="min-h-[200px]">
        {step === 1 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Shipping Information</h3>
            <input
              type="text"
              placeholder="Full Name"
              className="w-full rounded-lg border p-3"
            />
            <input
              type="text"
              placeholder="Address"
              className="w-full rounded-lg border p-3"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="City"
                className="w-full rounded-lg border p-3"
              />
              <input
                type="text"
                placeholder="ZIP Code"
                className="w-full rounded-lg border p-3"
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Payment Information</h3>
            <input
              type="text"
              placeholder="Card Number"
              className="w-full rounded-lg border p-3"
            />
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="MM/YY"
                className="w-full rounded-lg border p-3"
              />
              <input
                type="text"
                placeholder="CVV"
                className="w-full rounded-lg border p-3"
              />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
            <h3 className="font-bold text-lg">Review Order</h3>
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-semibold mb-2">Order Summary</p>
              <p className="text-sm text-gray-600">2 items</p>
              <p className="text-lg font-bold mt-2">Total: $359.97</p>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="mt-6 flex gap-4">
        {step > 1 && (
          <button
            onClick={() => setStep(step - 1)}
            className="flex-1 rounded-lg border py-2 hover:bg-gray-50"
          >
            Back
          </button>
        )}
        <button
          onClick={() => (step < 3 ? setStep(step + 1) : onComplete?.({}))}
          className="flex-1 rounded-lg bg-blue-600 py-2 text-white hover:bg-blue-700"
        >
          {step < 3 ? 'Continue' : 'Place Order'}
        </button>
      </div>
    </div>
  );
}
