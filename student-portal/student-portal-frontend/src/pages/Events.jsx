import React from 'react';
import { Calendar } from 'lucide-react';

const Events = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Events & Activities</h1>
      <div className="text-center py-12">
        <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Events Module</h3>
        <p className="text-gray-500">Event management and registration features coming soon...</p>
      </div>
    </div>
  );
};

export default Events;
