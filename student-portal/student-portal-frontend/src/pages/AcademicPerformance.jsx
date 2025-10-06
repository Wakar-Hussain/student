import React from 'react';
import { BarChart3 } from 'lucide-react';

const AcademicPerformance = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Academic Performance</h1>
      <div className="text-center py-12">
        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Academic Performance Module</h3>
        <p className="text-gray-500">Performance tracking and analytics features coming soon...</p>
      </div>
    </div>
  );
};

export default AcademicPerformance;
