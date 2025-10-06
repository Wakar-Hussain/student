import React from 'react';
import { Bell } from 'lucide-react';

const Notifications = () => {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
      <div className="text-center py-12">
        <Bell className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Notifications Module</h3>
        <p className="text-gray-500">Notification management features coming soon...</p>
      </div>
    </div>
  );
};

export default Notifications;
