import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../config/api';
import toast from 'react-hot-toast';
import { User, Mail, Phone, MapPin, Calendar, GraduationCap, Edit3, Save, X } from 'lucide-react';
import LoadingSpinner from '../components/LoadingSpinner';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [profile, setProfile] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const response = await api.get('/api/students/profile');
      setProfile(response.data.data.student);
      setEditData(response.data.data.student);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
    setEditData(profile);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setEditData(profile);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await api.put('/api/students/profile', editData);
      setProfile(response.data.data.student);
      updateUser(response.data.data.student);
      setIsEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Failed to update profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    setEditData({
      ...editData,
      [e.target.name]: e.target.value
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Profile Header */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 bg-primary-600 rounded-full flex items-center justify-center">
              <User className="w-10 h-10 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{profile?.name}</h1>
              <p className="text-gray-600">{profile?.student_id}</p>
              <p className="text-sm text-gray-500">{profile?.department} • Year {profile?.year}</p>
            </div>
          </div>
          <div className="flex space-x-2">
            {isEditing ? (
              <>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="btn btn-primary btn-sm flex items-center space-x-2"
                >
                  {saving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
                  <span>Save</span>
                </button>
                <button
                  onClick={handleCancel}
                  className="btn btn-secondary btn-sm flex items-center space-x-2"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel</span>
                </button>
              </>
            ) : (
              <button
                onClick={handleEdit}
                className="btn btn-primary btn-sm flex items-center space-x-2"
              >
                <Edit3 className="w-4 h-4" />
                <span>Edit Profile</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Profile Details */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <User className="w-5 h-5 mr-2" />
            Personal Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
              {isEditing ? (
                <input
                  type="text"
                  name="name"
                  value={editData.name || ''}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <p className="text-gray-900">{profile?.name}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="flex items-center space-x-2">
                <Mail className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">{profile?.email}</p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              {isEditing ? (
                <input
                  type="tel"
                  name="phone"
                  value={editData.phone || ''}
                  onChange={handleChange}
                  className="input"
                />
              ) : (
                <div className="flex items-center space-x-2">
                  <Phone className="w-4 h-4 text-gray-400" />
                  <p className="text-gray-900">{profile?.phone || 'Not provided'}</p>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
              <div className="flex items-center space-x-2">
                <Calendar className="w-4 h-4 text-gray-400" />
                <p className="text-gray-900">
                  {profile?.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'Not provided'}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              {isEditing ? (
                <textarea
                  name="address"
                  value={editData.address || ''}
                  onChange={handleChange}
                  rows={3}
                  className="input"
                />
              ) : (
                <div className="flex items-start space-x-2">
                  <MapPin className="w-4 h-4 text-gray-400 mt-1" />
                  <p className="text-gray-900">{profile?.address || 'Not provided'}</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Academic Information */}
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
            <GraduationCap className="w-5 h-5 mr-2" />
            Academic Information
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
              <p className="text-gray-900 font-mono">{profile?.student_id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Roll Number</label>
              <p className="text-gray-900 font-mono">{profile?.roll_number}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <p className="text-gray-900">{profile?.department}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <p className="text-gray-900">Year {profile?.year}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Semester</label>
              <p className="text-gray-900">Semester {profile?.semester}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Parent/Guardian Information */}
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Parent/Guardian Information</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Name</label>
            {isEditing ? (
              <input
                type="text"
                name="parent_name"
                value={editData.parent_name || ''}
                onChange={handleChange}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{profile?.parent_name || 'Not provided'}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Parent/Guardian Phone</label>
            {isEditing ? (
              <input
                type="tel"
                name="parent_phone"
                value={editData.parent_phone || ''}
                onChange={handleChange}
                className="input"
              />
            ) : (
              <p className="text-gray-900">{profile?.parent_phone || 'Not provided'}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
