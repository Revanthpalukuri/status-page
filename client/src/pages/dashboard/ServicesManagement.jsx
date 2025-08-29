import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Plus, Edit2, Trash2, Activity, AlertCircle, CheckCircle, Clock, Settings } from 'lucide-react';
import { serviceAPI, handleApiError } from '../../utils/api';
import { useSocket } from '../../contexts/SocketContext';
import { useAuth } from '../../contexts/AuthContext';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getStatusLabel, 
  getStatusBadgeClasses, 
  getStatusDotClasses,
  formatRelativeTime 
} from '../../utils/helpers';
import { SERVICE_STATUS, SERVICE_STATUS_LABELS } from '../../utils/constants';
import ServiceModal from '../../components/services/ServiceModal';
import DeleteConfirmModal from '../../components/ui/DeleteConfirmModal';
import toast from 'react-hot-toast';

const ServicesManagement = () => {
  const { organizationId } = useParams();
  const { user } = useAuth();
  const [services, setServices] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showServiceModal, setShowServiceModal] = useState(false);
  const [selectedService, setSelectedService] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [serviceToDelete, setServiceToDelete] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState({});
  const [uptimeInputs, setUptimeInputs] = useState({});
  const [isUpdatingUptime, setIsUpdatingUptime] = useState({});
  const [userRole, setUserRole] = useState('member'); // admin, member

  const { useRealtimeUpdates } = useSocket();

  const isAdmin = user?.role === 'admin' || userRole === 'admin';

  // Enable real-time updates for this organization
  useRealtimeUpdates(organizationId, null);

  useEffect(() => {
    if (organizationId) {
      loadServices();
    }
  }, [organizationId]);

  const loadServices = async () => {
    try {
      setIsLoading(true);
      const response = await serviceAPI.getByOrganization(organizationId);
      const servicesData = response.data.data.services;
      
      // Ensure all services have valid uptime percentages
      const validatedServices = servicesData.map(service => ({
        ...service,
        uptimePercentage: isNaN(service.uptimePercentage) || 
                         service.uptimePercentage === null || 
                         service.uptimePercentage === undefined
                         ? 100 // Default to 100% if invalid
                         : service.uptimePercentage
      }));
      
      setServices(validatedServices);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateService = () => {
    setSelectedService(null);
    setShowServiceModal(true);
  };

  const handleEditService = (service) => {
    setSelectedService(service);
    setShowServiceModal(true);
  };

  const handleDeleteService = (service) => {
    setServiceToDelete(service);
    setShowDeleteModal(true);
  };

  const confirmDeleteService = async () => {
    if (!serviceToDelete) return;

    try {
      await serviceAPI.delete(serviceToDelete.id);
      setServices(prev => prev.filter(s => s.id !== serviceToDelete.id));
      toast.success('Service deleted successfully');
      setShowDeleteModal(false);
      setServiceToDelete(null);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    }
  };

  const handleServiceSaved = (savedService) => {
    if (selectedService) {
      // Update existing service
      setServices(prev => prev.map(s => s.id === savedService.id ? savedService : s));
      toast.success('Service updated successfully');
    } else {
      // Add new service
      setServices(prev => [...prev, savedService]);
      toast.success('Service created successfully');
    }
    setShowServiceModal(false);
    setSelectedService(null);
  };

  const handleStatusChange = async (serviceId, newStatus) => {
    setIsUpdatingStatus(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const response = await serviceAPI.updateStatus(serviceId, newStatus);
      const updatedService = response.data.data.service;
      
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, status: updatedService.status } : s
      ));
      
      toast.success(`Service status updated to ${getStatusLabel(newStatus)}`);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsUpdatingStatus(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const handleUptimeChange = (serviceId, newUptime) => {
    setUptimeInputs(prev => ({
      ...prev,
      [serviceId]: newUptime
    }));
  };

  const handleSaveUptime = async (serviceId) => {
    const uptimeValue = parseFloat(uptimeInputs[serviceId]);
    
    if (isNaN(uptimeValue) || uptimeValue < 1 || uptimeValue > 100) {
      toast.error('Uptime percentage must be between 1 and 100');
      return;
    }
    
    setIsUpdatingUptime(prev => ({ ...prev, [serviceId]: true }));
    
    try {
      const response = await serviceAPI.updateUptime(serviceId, { uptimePercentage: uptimeValue });
      const updatedService = response.data.data.service;
      
      // Ensure uptime percentage is a valid number
      const validUptimePercentage = isNaN(updatedService.uptimePercentage) || 
                                   updatedService.uptimePercentage === null || 
                                   updatedService.uptimePercentage === undefined
                                   ? uptimeValue
                                   : updatedService.uptimePercentage;
      
      setServices(prev => prev.map(s => 
        s.id === serviceId ? { ...s, uptimePercentage: validUptimePercentage } : s
      ));
      
      // Clear the input after successful save
      setUptimeInputs(prev => {
        const newInputs = { ...prev };
        delete newInputs[serviceId];
        return newInputs;
      });
      
      toast.success('Service uptime updated successfully');
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsUpdatingUptime(prev => ({ ...prev, [serviceId]: false }));
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case SERVICE_STATUS.OPERATIONAL:
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case SERVICE_STATUS.DEGRADED_PERFORMANCE:
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case SERVICE_STATUS.PARTIAL_OUTAGE:
        return <AlertCircle className="h-4 w-4 text-orange-500" />;
      case SERVICE_STATUS.MAJOR_OUTAGE:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
      case SERVICE_STATUS.UNDER_MAINTENANCE:
        return <Settings className="h-4 w-4 text-blue-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div>
              <h1 className="text-xl font-semibold text-gray-900">Services</h1>
              <p className="text-sm text-gray-600">
                {isAdmin ? 'Manage your services and their status' : 'View your services and their current status'}
              </p>
            </div>
            {isAdmin && (
              <Button
                variant="primary"
                onClick={handleCreateService}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Service
              </Button>
            )}
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {services.length === 0 ? (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first service to start monitoring its status.
            </p>
            <Button variant="primary" onClick={handleCreateService}>
              <Plus className="h-4 w-4 mr-2" />
              Create Service
            </Button>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {services.map((service) => (
              <div
                key={service.id}
                className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`${getStatusDotClasses(service.status)} h-3 w-3 rounded-full mr-3`}></div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {service.name}
                    </h3>
                  </div>
                  {isAdmin && (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handleEditService(service)}
                        className="text-gray-400 hover:text-gray-600"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteService(service)}
                        className="text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {service.description && (
                  <p className="text-gray-600 text-sm mb-4">
                    {service.description}
                  </p>
                )}

                {service.url && (
                  <div className="mb-4">
                    <a
                      href={service.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-600 hover:text-blue-800"
                    >
                      {service.url}
                    </a>
                  </div>
                )}

                {isAdmin ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Status
                      </label>
                      <select
                        value={service.status}
                        onChange={(e) => handleStatusChange(service.id, e.target.value)}
                        disabled={isUpdatingStatus[service.id]}
                        className="form-input text-sm"
                      >
                        {Object.entries(SERVICE_STATUS_LABELS).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Uptime Percentage
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="number"
                          min="1"
                          max="100"
                          step="0.01"
                          value={uptimeInputs[service.id] !== undefined ? uptimeInputs[service.id] : service.uptimePercentage || 100}
                          onChange={(e) => handleUptimeChange(service.id, e.target.value)}
                          disabled={isUpdatingUptime[service.id]}
                          className="form-input text-sm flex-1"
                          placeholder="100.00"
                        />
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => handleSaveUptime(service.id)}
                          disabled={isUpdatingUptime[service.id] || uptimeInputs[service.id] === undefined}
                          className="px-3 py-1"
                        >
                          {isUpdatingUptime[service.id] ? 'Saving...' : 'Save'}
                        </Button>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Current: {service.uptimePercentage || 100}% (Enter 1-100)</p>
                    </div>
                  </div>
                ) : (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Status
                    </label>
                    <span className={getStatusBadgeClasses(service.status)}>
                      {getStatusIcon(service.status)}
                      <span className="ml-1">{getStatusLabel(service.status)}</span>
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between">
                  <span className={getStatusBadgeClasses(service.status)}>
                    {getStatusIcon(service.status)}
                    <span className="ml-1">{getStatusLabel(service.status)}</span>
                  </span>
                  <span className="text-xs text-gray-500">
                    Updated {formatRelativeTime(service.updated_at)}
                  </span>
                </div>

                {service.uptimePercentage && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Uptime</span>
                      <span className="font-medium">{service.uptimePercentage}%</span>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Service Modal */}
      {showServiceModal && (
        <ServiceModal
          isOpen={showServiceModal}
          onClose={() => {
            setShowServiceModal(false);
            setSelectedService(null);
          }}
          onSaved={handleServiceSaved}
          service={selectedService}
          organizationId={organizationId}
        />
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmModal
          isOpen={showDeleteModal}
          onClose={() => {
            setShowDeleteModal(false);
            setServiceToDelete(null);
          }}
          onConfirm={confirmDeleteService}
          title="Delete Service"
          message={`Are you sure you want to delete "${serviceToDelete?.name}"? This action cannot be undone.`}
        />
      )}
    </div>
  );
};

export default ServicesManagement;
