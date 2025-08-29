import React, { useState } from 'react';
import { X, Building2 } from 'lucide-react';
import { organizationAPI, handleApiError } from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';

const JoinOrganizationModal = ({ isOpen, onClose, onSuccess }) => {
  const [formData, setFormData] = useState({
    slug: '',
    accessCode: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.slug.trim() || !formData.accessCode.trim()) {
      toast.error('Please fill in all fields');
      return;
    }

    try {
      setIsLoading(true);
      const response = await organizationAPI.join({
        slug: formData.slug.trim(),
        accessCode: formData.accessCode.trim(),
      });

      toast.success(response.data.message || 'Successfully joined organization!');
      
      // Reset form
      setFormData({
        slug: '',
        accessCode: '',
      });
      
      if (onSuccess) {
        onSuccess(response.data.data.organization);
      }
      
      onClose();
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        slug: '',
        accessCode: '',
      });
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center">
            <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg mr-3">
              <Building2 className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900">Join Organization</h2>
              <p className="text-sm text-gray-600">Enter organization details to join</p>
            </div>
          </div>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label htmlFor="slug" className="block text-sm font-medium text-gray-700 mb-2">
              Organization Slug *
            </label>
            <Input
              id="slug"
              name="slug"
              type="text"
              value={formData.slug}
              onChange={handleInputChange}
              placeholder="e.g., demo-company"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              The organization's unique identifier (usually shown in the URL)
            </p>
          </div>

          <div>
            <label htmlFor="accessCode" className="block text-sm font-medium text-gray-700 mb-2">
              Access Code *
            </label>
            <Input
              id="accessCode"
              name="accessCode"
              type="text"
              value={formData.accessCode}
              onChange={handleInputChange}
              placeholder="Enter the access code"
              disabled={isLoading}
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Contact your organization admin for the access code
            </p>
          </div>

          {/* Instructions */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h4 className="text-sm font-medium text-blue-900 mb-2">How to join an organization:</h4>
            <ul className="text-xs text-blue-700 space-y-1">
              <li>• Get the organization slug from your admin (e.g., "demo-company")</li>
              <li>• Get the 7-digit access code from your organization admin</li>
              <li>• Once joined, you'll be able to view services and status updates</li>
            </ul>
            <div className="mt-3 p-2 bg-blue-100 rounded">
              <p className="text-xs text-blue-800 font-medium">Demo Organization:</p>
              <p className="text-xs text-blue-700">Slug: demo-company</p>
              <p className="text-xs text-blue-700">Access Code: 1234567</p>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isLoading}
              className="min-w-24"
            >
              {isLoading ? <LoadingSpinner size="sm" /> : 'Join Organization'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default JoinOrganizationModal;
