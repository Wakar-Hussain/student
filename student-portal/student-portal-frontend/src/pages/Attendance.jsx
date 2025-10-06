import React, { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Attendance = () => {
  const [attendance, setAttendance] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAttendance();
  }, []);

  const fetchAttendance = async () => {
    try {
      const response = await api.get('/api/attendance/summary');
      setAttendance(response.data.data.attendance);
    } catch (error) {
      console.error('Failed to fetch attendance:', error);
      toast.error('Failed to load attendance data');
    } finally {
      setLoading(false);
    }
  };

  const getAttendanceColor = (percentage) => {
    if (percentage >= 75) return 'text-green-600 bg-green-50';
    if (percentage >= 60) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
  };

  const getAttendanceIcon = (percentage) => {
    if (percentage >= 75) return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (percentage >= 60) return <AlertCircle className="w-5 h-5 text-yellow-600" />;
    return <XCircle className="w-5 h-5 text-red-600" />;
  };

  const getAttendanceStatus = (percentage) => {
    if (percentage >= 75) return 'Good';
    if (percentage >= 60) return 'Warning';
    return 'Critical';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const overallAttendance = attendance.length > 0 
    ? Math.round(attendance.reduce((acc, curr) => acc + curr.attendance_percentage, 0) / attendance.length)
    : 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Attendance Overview</h1>
        <div className="flex items-center space-x-2 text-sm text-gray-500">
          <Calendar className="w-4 h-4" />
          <span>Current Semester</span>
        </div>
      </div>

      {/* Overall Attendance Card */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Overall Attendance</h3>
            <p className="text-sm text-gray-600">Average across all courses</p>
          </div>
          <div className="text-right">
            <div className={`text-3xl font-bold ${getAttendanceColor(overallAttendance).split(' ')[0]}`}>
              {overallAttendance}%
            </div>
            <div className={`text-sm font-medium ${getAttendanceColor(overallAttendance).split(' ')[0]}`}>
              {getAttendanceStatus(overallAttendance)}
            </div>
          </div>
        </div>
        
        {/* Progress Bar */}
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-300 ${
                overallAttendance >= 75 ? 'bg-green-500' : 
                overallAttendance >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${overallAttendance}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Course-wise Attendance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {attendance.map((item, index) => (
          <div key={index} className="bg-white rounded-lg shadow-sm border p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                {getAttendanceIcon(item.attendance_percentage)}
                <div>
                  <h3 className="font-semibold text-gray-900">{item.course_name}</h3>
                  <p className="text-sm text-gray-500">{item.course_code}</p>
                </div>
              </div>
              <div className="text-right">
                <div className={`text-2xl font-bold ${getAttendanceColor(item.attendance_percentage).split(' ')[0]}`}>
                  {item.attendance_percentage}%
                </div>
                <div className={`text-xs font-medium ${getAttendanceColor(item.attendance_percentage).split(' ')[0]}`}>
                  {getAttendanceStatus(item.attendance_percentage)}
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="mb-4">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    item.attendance_percentage >= 75 ? 'bg-green-500' : 
                    item.attendance_percentage >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${item.attendance_percentage}%` }}
                ></div>
              </div>
            </div>

            {/* Attendance Stats */}
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-lg font-semibold text-green-600">{item.present_classes}</div>
                <div className="text-xs text-green-600">Present</div>
              </div>
              <div className="p-3 bg-red-50 rounded-lg">
                <div className="text-lg font-semibold text-red-600">{item.absent_classes}</div>
                <div className="text-xs text-red-600">Absent</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-lg font-semibold text-blue-600">{item.late_classes}</div>
                <div className="text-xs text-blue-600">Late</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Total Classes: {item.total_classes}</span>
                <span>Attendance: {item.present_classes}/{item.total_classes}</span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {attendance.length === 0 && (
        <div className="text-center py-12">
          <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No attendance data</h3>
          <p className="text-gray-500">Attendance records will appear here once classes begin.</p>
        </div>
      )}

      {/* Attendance Guidelines */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">Attendance Guidelines</h3>
        <div className="space-y-2 text-sm text-blue-800">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span>75% and above: Good attendance</span>
          </div>
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-4 h-4 text-yellow-600" />
            <span>60-74%: Warning - Improve attendance</span>
          </div>
          <div className="flex items-center space-x-2">
            <XCircle className="w-4 h-4 text-red-600" />
            <span>Below 60%: Critical - May affect eligibility</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
