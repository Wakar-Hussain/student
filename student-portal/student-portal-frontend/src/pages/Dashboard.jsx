import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import {
  BookOpen,
  Calendar,
  FileText,
  CreditCard,
  Bell,
  TrendingUp,
  Clock,
  Users,
  Award,
  AlertCircle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const response = await api.get('/api/students/dashboard');
      setDashboardData(response.data.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const { student, courses, attendance, notifications, upcomingAssignments, feeSummary } = dashboardData || {};

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600';
    if (percentage >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getAttendanceIcon = (percentage) => {
    if (percentage >= 75) return <CheckCircle className="w-4 h-4 text-green-600" />;
    if (percentage >= 60) return <AlertCircle className="w-4 h-4 text-yellow-600" />;
    return <XCircle className="w-4 h-4 text-red-600" />;
  };

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-gradient-to-r from-primary-600 to-primary-700 rounded-lg p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Welcome back, {student?.name}!</h1>
            <p className="text-primary-100 mt-1">
              {student?.department} • Year {student?.year} • Semester {student?.semester}
            </p>
            <p className="text-primary-200 text-sm mt-1">Student ID: {student?.student_id}</p>
          </div>
          <div className="hidden md:block">
            <div className="w-20 h-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Users className="w-10 h-10" />
            </div>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Courses</p>
              <p className="text-2xl font-bold text-gray-900">{courses?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Avg Attendance</p>
              <p className="text-2xl font-bold text-gray-900">
                {attendance?.length > 0 
                  ? Math.round(attendance.reduce((acc, curr) => acc + curr.attendance_percentage, 0) / attendance.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <Clock className="w-6 h-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending Assignments</p>
              <p className="text-2xl font-bold text-gray-900">{upcomingAssignments?.length || 0}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <Bell className="w-6 h-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Unread Notifications</p>
              <p className="text-2xl font-bold text-gray-900">
                {notifications?.filter(n => !n.is_read).length || 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Overview */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Attendance Overview</h3>
            <Calendar className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {attendance?.map((item, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getAttendanceIcon(item.attendance_percentage)}
                  <div>
                    <p className="font-medium text-gray-900">{item.course_name}</p>
                    <p className="text-sm text-gray-500">
                      {item.present_classes}/{item.total_classes} classes
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className={`font-semibold ${getAttendanceColor(item.attendance_percentage)}`}>
                    {item.attendance_percentage}%
                  </p>
                </div>
              </div>
            ))}
            {(!attendance || attendance.length === 0) && (
              <p className="text-gray-500 text-center py-4">No attendance data available</p>
            )}
          </div>
        </div>

        {/* Upcoming Assignments */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h3>
            <FileText className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {upcomingAssignments?.slice(0, 5).map((assignment, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">{assignment.title}</p>
                  <p className="text-sm text-gray-500">{assignment.course_name}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">
                    Due: {new Date(assignment.due_date).toLocaleDateString()}
                  </p>
                  <p className="text-xs text-red-600">
                    {Math.ceil((new Date(assignment.due_date) - new Date()) / (1000 * 60 * 60 * 24))} days left
                  </p>
                </div>
              </div>
            ))}
            {(!upcomingAssignments || upcomingAssignments.length === 0) && (
              <p className="text-gray-500 text-center py-4">No upcoming assignments</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Notifications */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Notifications</h3>
            <Bell className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            {notifications?.slice(0, 4).map((notification, index) => (
              <div key={index} className={`p-3 rounded-lg ${!notification.is_read ? 'bg-blue-50 border-l-4 border-blue-400' : 'bg-gray-50'}`}>
                <p className="font-medium text-gray-900">{notification.title}</p>
                <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                <p className="text-xs text-gray-400 mt-2">
                  {new Date(notification.created_at).toLocaleDateString()}
                </p>
              </div>
            ))}
            {(!notifications || notifications.length === 0) && (
              <p className="text-gray-500 text-center py-4">No notifications</p>
            )}
          </div>
        </div>

        {/* Fee Summary */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Fee Summary</h3>
            <CreditCard className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Total Fees</span>
              <span className="font-semibold">₹{feeSummary?.total_amount || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Paid</span>
              <span className="font-semibold text-green-600">₹{feeSummary?.total_paid || 0}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Pending</span>
              <span className="font-semibold text-red-600">₹{feeSummary?.total_pending || 0}</span>
            </div>
            <div className="pt-2 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500">Status</span>
                <span className={`text-sm font-medium ${feeSummary?.pending_fees > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  {feeSummary?.pending_fees > 0 ? 'Pending Payments' : 'All Paid'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-lg p-6 shadow-sm border">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Quick Actions</h3>
            <Award className="w-5 h-5 text-gray-400" />
          </div>
          <div className="space-y-3">
            <button className="w-full text-left p-3 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors">
              <p className="font-medium text-blue-900">View Timetable</p>
              <p className="text-sm text-blue-600">Check your class schedule</p>
            </button>
            <button className="w-full text-left p-3 bg-green-50 hover:bg-green-100 rounded-lg transition-colors">
              <p className="font-medium text-green-900">Submit Assignment</p>
              <p className="text-sm text-green-600">Upload your work</p>
            </button>
            <button className="w-full text-left p-3 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors">
              <p className="font-medium text-purple-900">View Results</p>
              <p className="text-sm text-purple-600">Check your grades</p>
            </button>
            <button className="w-full text-left p-3 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors">
              <p className="font-medium text-orange-900">Pay Fees</p>
              <p className="text-sm text-orange-600">Make payment online</p>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
