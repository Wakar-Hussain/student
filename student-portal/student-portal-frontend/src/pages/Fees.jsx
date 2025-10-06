import React from 'react';
import { CreditCard } from 'lucide-react';

const Fees = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Fees & Payments</h1>
      <div className="text-center py-12">
        <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Fees Module</h3>
        <p className="text-gray-500">Fee management and payment features coming soon...</p>
      </div>
    </div>
  );
};

export default Fees;
