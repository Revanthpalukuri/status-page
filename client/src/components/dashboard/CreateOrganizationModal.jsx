import React, { useState } from 'react';
import { X } from 'lucide-react';
import { organizationAPI, handleApiError } from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import { slugify, validateUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const CreateOrganizationModal = ({ isOpen, onClose, onOrganizationCreated }) => {
  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    description: '',
    websiteUrl: '',
  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const newData = { ...prev, [name]: value };
      
      // Auto-generate slug from name
      if (name === 'name') {
        newData.slug = slugify(value);
      }
      
      return newData;
    });
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Organization name is required';
    }

    if (!formData.slug.trim()) {
      newErrors.slug = 'Organization slug is required';
    } else if (formData.slug.length < 3) {
      newErrors.slug = 'Slug must be at least 3 characters long';
    } else if (!/^[a-z0-9-]+$/.test(formData.slug)) {
      newErrors.slug = 'Slug can only contain lowercase letters, numbers, and hyphens';
    }

    if (formData.websiteUrl && !validateUrl(formData.websiteUrl)) {
      newErrors.websiteUrl = 'Please enter a valid URL';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      const response = await organizationAPI.create({
        name: formData.name.trim(),
        slug: formData.slug.trim(),
        description: formData.description.trim(),
        websiteUrl: formData.websiteUrl.trim() || undefined,
      });

      const organization = response.data.data.organization;
      onOrganizationCreated(organization);
      toast.success('Organization created successfully!');
      
      // Reset form
      setFormData({
        name: '',
        slug: '',
        description: '',
        websiteUrl: '',
      });
      setErrors({});
    } catch (error) {
      const errorInfo = handleApiError(error);
      
      if (errorInfo.errors && errorInfo.errors.length > 0) {
        const serverErrors = {};
        errorInfo.errors.forEach(err => {
          serverErrors[err.field] = err.message;
        });
        setErrors(serverErrors);
      } else {
        toast.error(errorInfo.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    if (!isLoading) {
      setFormData({
        name: '',
        slug: '',
        description: '',
        websiteUrl: '',
      });
      setErrors({});
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            Create Organization
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <Input
            label="Organization Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter organization name"
            required
            error={errors.name}
          />

          <Input
            label="URL Slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
            placeholder="organization-slug"
            required
            error={errors.slug}
            help="This will be used in your status page URL: /status/your-slug"
          />

          <Textarea
            label="Description"
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Brief description of your organization"
            rows={3}
            error={errors.description}
          />

          <Input
            label="Website URL"
            name="websiteUrl"
            type="url"
            value={formData.websiteUrl}
            onChange={handleChange}
            placeholder="https://yourwebsite.com"
            error={errors.websiteUrl}
          />

          <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              Create Organization
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateOrganizationModal;
