import React, { useState, useEffect } from 'react';
import api from '../config/api';
import toast from 'react-hot-toast';
import { BookOpen, User, Calendar, Clock, Award } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Courses = () => {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const response = await api.get('/api/courses');
      setCourses(response.data.data.courses);
    } catch (error) {
      console.error('Failed to fetch courses:', error);
      toast.error('Failed to load courses');
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
        <div className="text-sm text-gray-500">
          {courses.length} course{courses.length !== 1 ? 's' : ''} enrolled
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <div key={course.id} className="bg-white rounded-lg shadow-sm border p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <BookOpen className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">{course.course_name}</h3>
                  <p className="text-sm text-gray-500">{course.course_code}</p>
                </div>
              </div>
              {course.grade && (
                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-medium rounded-full">
                  {course.grade}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <User className="w-4 h-4" />
                <span>{course.faculty_name}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Calendar className="w-4 h-4" />
                <span>Semester {course.semester}, {course.year}</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Award className="w-4 h-4" />
                <span>{course.credits} Credits</span>
              </div>

              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  course.status === 'active' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {course.status}
                </span>
              </div>
            </div>

            {course.description && (
              <div className="mt-4 pt-4 border-t">
                <p className="text-sm text-gray-600">{course.description}</p>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <button className="w-full btn btn-outline btn-sm">
                View Details
              </button>
            </div>
          </div>
        ))}
      </div>

      {courses.length === 0 && (
        <div className="text-center py-12">
          <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No courses found</h3>
          <p className="text-gray-500">You are not enrolled in any courses yet.</p>
        </div>
      )}
    </div>
  );
};

export default Courses;
