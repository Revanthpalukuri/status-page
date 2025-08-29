import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ExternalLink, Clock, AlertCircle, CheckCircle, Activity } from 'lucide-react';
import { publicAPI, handleApiError } from '../../utils/api';
import { useSocket } from '../../contexts/SocketContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getStatusLabel, 
  getStatusBadgeClasses, 
  getStatusDotClasses, 
  getOverallStatusMessage,
  formatRelativeTime,
  formatDate
} from '../../utils/helpers';
import toast from 'react-hot-toast';

const PublicStatusPage = () => {
  const { slug } = useParams();
  const [data, setData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const { useRealtimeUpdates } = useSocket();

  // Enable real-time updates for this status page
  useRealtimeUpdates(null, slug);

  useEffect(() => {
    loadStatusPage();
  }, [slug]);

  const loadStatusPage = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await publicAPI.getStatusPage(slug);
      setData(response.data.data);
    } catch (error) {
      const errorInfo = handleApiError(error);
      setError(errorInfo);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Status Page Not Found
          </h1>
          <p className="text-gray-600 mb-6">
            The status page you're looking for doesn't exist or is not publicly available.
          </p>
        </div>
      </div>
    );
  }

  const { organization, services, activeIncidents, scheduledMaintenance, overallStatus } = data;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {organization.logoUrl && (
                <img
                  src={organization.logoUrl}
                  alt={`${organization.name} logo`}
                  className="h-10 w-10 rounded-lg object-cover mr-4"
                />
              )}
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  {organization.name}
                </h1>
                {organization.description && (
                  <p className="text-gray-600 mt-1">
                    {organization.description}
                  </p>
                )}
              </div>
            </div>
            {organization.websiteUrl && (
              <a
                href={organization.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-gray-700"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overall Status */}
        <div className="mb-8">
          <div className="flex items-center mb-4">
            <div className={`${getStatusDotClasses(overallStatus)} mr-3`}></div>
            <h2 className="text-xl font-semibold text-gray-900">
              {getOverallStatusMessage(services)}
            </h2>
          </div>
          <div className="text-sm text-gray-600">
            Last updated {formatRelativeTime(new Date())}
          </div>
        </div>

        {/* Active Incidents */}
        {activeIncidents.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <AlertCircle className="h-5 w-5 mr-2 text-red-500" />
              Active Incidents
            </h3>
            <div className="space-y-4">
              {activeIncidents.map((incident) => (
                <div
                  key={incident.id}
                  className="bg-white rounded-lg border border-red-200 p-6"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 mb-2">
                        {incident.title}
                      </h4>
                      <div className="flex items-center space-x-4 text-sm text-gray-600 mb-3">
                        <span className={getStatusBadgeClasses(incident.status)}>
                          {getStatusLabel(incident.status)}
                        </span>
                        <span>Started {formatRelativeTime(incident.startedAt)}</span>
                        {incident.severity && (
                          <span className="capitalize">{incident.severity} impact</span>
                        )}
                      </div>
                      {incident.affectedServices.length > 0 && (
                        <div className="mb-3">
                          <span className="text-sm text-gray-600">Affected services: </span>
                          {incident.affectedServices.map((service, index) => (
                            <span key={service.id} className="text-sm font-medium">
                              {service.name}
                              {index < incident.affectedServices.length - 1 && ', '}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                  {incident.updates.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <div className="text-sm">
                        <div className="font-medium text-gray-900">
                          Latest Update
                        </div>
                        <div className="text-gray-600 mt-1">
                          {incident.updates[0].description}
                        </div>
                        <div className="text-gray-500 text-xs mt-2">
                          {formatRelativeTime(incident.updates[0].createdAt)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Scheduled Maintenance */}
        {scheduledMaintenance.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Clock className="h-5 w-5 mr-2 text-blue-500" />
              Scheduled Maintenance
            </h3>
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => (
                <div
                  key={maintenance.id}
                  className="bg-white rounded-lg border border-blue-200 p-6"
                >
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {maintenance.title}
                  </h4>
                  <div className="text-sm text-gray-600 mb-3">
                    Scheduled for {formatDate(maintenance.scheduledFor, 'MMM dd, yyyy HH:mm')}
                    {maintenance.scheduledUntil && (
                      <> - {formatDate(maintenance.scheduledUntil, 'HH:mm')}</>
                    )}
                  </div>
                  {maintenance.affectedServices.length > 0 && (
                    <div>
                      <span className="text-sm text-gray-600">Affected services: </span>
                      {maintenance.affectedServices.map((service, index) => (
                        <span key={service.id} className="text-sm font-medium">
                          {service.name}
                          {index < maintenance.affectedServices.length - 1 && ', '}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Services */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Services
          </h3>
          <div className="bg-white rounded-lg border border-gray-200 divide-y divide-gray-200">
            {services.map((service) => (
              <div key={service.id} className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className={`${getStatusDotClasses(service.status)} mr-3`}></div>
                    <div>
                      <h4 className="font-medium text-gray-900">
                        {service.name}
                      </h4>
                      {service.description && (
                        <p className="text-sm text-gray-600 mt-1">
                          {service.description}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={getStatusBadgeClasses(service.status)}>
                      {getStatusLabel(service.status)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* No Services */}
        {services.length === 0 && (
          <div className="text-center py-12">
            <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No services configured
            </h3>
            <p className="text-gray-600">
              This status page doesn't have any services configured yet.
            </p>
          </div>
        )}

        {/* Footer */}
        <div className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            Powered by Status Page • Last updated {formatRelativeTime(new Date())}
          </p>
        </div>
      </main>
    </div>
  );
};

export default PublicStatusPage;
