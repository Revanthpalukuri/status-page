import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { serviceAPI, handleApiError } from '../../utils/api';
import Button from '../ui/Button';
import Input from '../ui/Input';
import Textarea from '../ui/Textarea';
import Select from '../ui/Select';
import { SERVICE_STATUS_LABELS } from '../../utils/constants';
import { validateUrl } from '../../utils/helpers';
import toast from 'react-hot-toast';

const ServiceModal = ({ isOpen, onClose, onSaved, service, organizationId }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    url: '',
    status: 'operational',
    order: 0,
    isPublic: true,

  });
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  // Populate form data when editing
  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        url: service.url || '',
        status: service.status || 'operational',
        order: service.order || 0,
        isPublic: service.isPublic !== undefined ? service.isPublic : true,
      });
    } else {
      // Reset form for new service
      setFormData({
        name: '',
        description: '',
        url: '',
        status: 'operational',
        order: 0,
        isPublic: true,
      });
    }
    setErrors({});
  }, [service]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    const fieldValue = type === 'checkbox' ? checked : value;
    
    setFormData(prev => ({
      ...prev,
      [name]: fieldValue,
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Service name is required';
    }

    if (formData.url && !validateUrl(formData.url)) {
      newErrors.url = 'Please enter a valid URL';
    }



    if (formData.order < 0) {
      newErrors.order = 'Order must be a positive number';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      setIsLoading(true);
      
      const serviceData = {
        ...formData,
        order: parseInt(formData.order) || 0,
      };

      let response;
      if (service) {
        // Update existing service
        response = await serviceAPI.update(service.id, serviceData);
      } else {
        // Create new service
        response = await serviceAPI.create(organizationId, serviceData);
      }

      const savedService = response.data.data.service;
      onSaved(savedService);
      
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
      onClose();
    }
  };

  if (!isOpen) return null;

  const statusOptions = Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => ({
    value,
    label,
  }));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {service ? 'Edit Service' : 'Create New Service'}
          </h3>
          <button
            onClick={handleClose}
            disabled={isLoading}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <Input
                label="Service Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Enter service name"
                required
                error={errors.name}
              />
            </div>

            <div className="md:col-span-2">
              <Textarea
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Brief description of the service"
                rows={3}
                error={errors.description}
              />
            </div>

            <Input
              label="Service URL"
              name="url"
              type="url"
              value={formData.url}
              onChange={handleChange}
              placeholder="https://example.com"
              error={errors.url}
            />

            <Select
              label="Status"
              name="status"
              value={formData.status}
              onChange={handleChange}
              options={statusOptions}
              error={errors.status}
            />

            <Input
              label="Display Order"
              name="order"
              type="number"
              value={formData.order}
              onChange={handleChange}
              placeholder="0"
              error={errors.order}
              min="0"
            />

            <div className="flex items-center space-x-4">
              <label className="flex items-center">
                <input
                  type="checkbox"
                  name="isPublic"
                  checked={formData.isPublic}
                  onChange={handleChange}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm font-medium text-gray-700">
                  Show on public status page
                </span>
              </label>
            </div>
          </div>



          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
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
              {service ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ServiceModal;
