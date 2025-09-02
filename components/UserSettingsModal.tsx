'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, User, Mail, Camera, Save } from 'lucide-react';
import { useStore } from '@/store/useStore';
import ImageCropModal from './ImageCropModal';
import toast from 'react-hot-toast';

interface UserSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function UserSettingsModal({ isOpen, onClose }: UserSettingsModalProps) {
  const { user, setUser } = useStore();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    image: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isImageCropOpen, setIsImageCropOpen] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        image: user.image || '',
      });
    }
  }, [user]);

  const handleImageSave = (croppedImageUrl: string) => {
    setFormData(prev => ({ ...prev, image: croppedImageUrl }));
    toast.success('Profile picture updated!');
  };

  const handleSave = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Update the user data in local storage and store
      const updatedUser = {
        ...user,
        name: formData.name,
        image: formData.image,
      };

      // Try to update user in Sensay API (optional - don't fail if it doesn't work)
      try {
        await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            id: updatedUser.id,
            email: updatedUser.email,
            name: updatedUser.name,
            linkedAccounts: ['google'],
          }),
        });
      } catch (apiError) {
        console.log('Sensay API update failed, continuing with local update:', apiError);
      }

      // Save to local storage
      localStorage.setItem('sensayUser', JSON.stringify(updatedUser));
      
      // Update the store
      setUser(updatedUser);

      toast.success('Profile updated successfully!');
      onClose();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 max-w-md w-full border border-gray-700"
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-bold text-white flex items-center gap-2">
              <User className="w-6 h-6 text-purple-400" />
              User Settings
            </h2>
            <button
              type="button"
              onClick={onClose}
              title="Close settings"
              className="text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* Profile Picture */}
            <div className="flex flex-col items-center space-y-3">
              <div className="relative">
                {formData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={formData.image}
                    alt="Profile"
                    className="w-20 h-20 rounded-full object-cover border-4 border-purple-500"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-10 h-10 text-white" />
                  </div>
                )}
                <button
                  type="button"
                  title="Change profile picture"
                  className="absolute bottom-0 right-0 bg-purple-600 hover:bg-purple-700 text-white p-1.5 rounded-full transition-colors"
                  onClick={() => setIsImageCropOpen(true)}
                >
                  <Camera className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm text-gray-400">Click camera to upload & crop image</p>
            </div>

            {/* Name Field */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Display Name
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full pl-10 pr-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-purple-500 transition-colors"
                  placeholder="Enter your name"
                />
              </div>
            </div>

            {/* Email Field (Read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="email"
                  value={formData.email}
                  readOnly
                  className="w-full pl-10 pr-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-gray-300 cursor-not-allowed"
                  placeholder="Email from Google account"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Email cannot be changed (linked to Google account)</p>
            </div>

            {/* Account Info */}
            <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
              <h3 className="text-sm font-medium text-gray-300 mb-2">Account Information</h3>
              <div className="space-y-2 text-sm text-gray-400">
                <div className="flex justify-between">
                  <span>User ID:</span>
                  <span className="font-mono text-xs">{user?.id?.substring(0, 16)}...</span>
                </div>
                <div className="flex justify-between">
                  <span>Account Type:</span>
                  <span className="text-green-400">Google OAuth</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span className="text-green-400">Verified</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={isLoading}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-lg transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                {isLoading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </motion.div>

        <ImageCropModal
          isOpen={isImageCropOpen}
          onClose={() => setIsImageCropOpen(false)}
          onSave={handleImageSave}
        />
      </div>
    </AnimatePresence>
  );
}