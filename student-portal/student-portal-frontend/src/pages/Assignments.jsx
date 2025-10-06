import React from 'react';
import { FileText, Clock, CheckCircle } from 'lucide-react';

const Assignments = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
      <div className="text-center py-12">
        <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Assignments Module</h3>
        <p className="text-gray-500">Assignment management features coming soon...</p>
      </div>
    </div>
  );
};

export default Assignments;
