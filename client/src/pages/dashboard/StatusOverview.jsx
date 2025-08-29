import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Activity, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  TrendingUp, 
  Settings,
  ExternalLink,
  Calendar
} from 'lucide-react';
import { serviceAPI, incidentAPI, publicAPI, handleApiError } from '../../utils/api';
import { useSocket } from '../../contexts/SocketContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  getStatusLabel, 
  getStatusBadgeClasses, 
  getStatusDotClasses,
  formatRelativeTime,
  formatDateTime
} from '../../utils/helpers';
import { SERVICE_STATUS, INCIDENT_STATUS } from '../../utils/constants';
import toast from 'react-hot-toast';

const StatusOverview = () => {
  const { organizationId } = useParams();
  const [services, setServices] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [recentIncidents, setRecentIncidents] = useState([]);
  const [maintenances, setMaintenances] = useState([]);
  const [overallStatus, setOverallStatus] = useState('operational');
  const [isLoading, setIsLoading] = useState(true);
  const [stats, setStats] = useState({
    totalServices: 0,
    operationalServices: 0,
    activeIncidents: 0,
    avgUptime: 99.9
  });

  const { useRealtimeUpdates } = useSocket();

  // Helper function to generate fallback uptime percentage
  const generateFallbackUptime = () => Math.floor(Math.random() * 51) + 50; // Random 50-100

  // Enable real-time updates for this organization
  useRealtimeUpdates(organizationId, null);

  useEffect(() => {
    if (organizationId) {
      loadOverviewData();
    }
  }, [organizationId]);

  const loadOverviewData = async () => {
    try {
      setIsLoading(true);
      await Promise.all([
        loadServices(),
        loadIncidents(),
        loadRecentIncidents()
      ]);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const loadServices = async () => {
    try {
      const response = await serviceAPI.getByOrganization(organizationId);
      const servicesData = response.data.data.services;
      setServices(servicesData);
      
      // Calculate overall status
      calculateOverallStatus(servicesData);
      
      // Calculate stats
      const operational = servicesData.filter(s => s.status === SERVICE_STATUS.OPERATIONAL).length;
      
      // Calculate average uptime with proper error handling
      let avgUptime = 100; // Default value
      
      if (servicesData.length > 0) {
        const validUptimes = servicesData
          .map(service => {
            const uptime = service.uptimePercentage;
            // Handle invalid values: null, undefined, NaN, or non-numeric
            if (uptime === null || uptime === undefined || isNaN(uptime) || typeof uptime !== 'number') {
              return 100; // Default to 100% for invalid values
            }
            return Math.max(0, Math.min(100, uptime)); // Clamp between 0-100
          });
        
        const sum = validUptimes.reduce((acc, uptime) => acc + uptime, 0);
        const calculated = sum / validUptimes.length;
        
        // If calculation results in NaN, generate random percentage between 50-100
        if (isNaN(calculated)) {
          avgUptime = generateFallbackUptime();
          console.warn('Uptime calculation resulted in NaN, using random fallback:', avgUptime);
        } else {
          avgUptime = parseFloat(calculated.toFixed(2)); // Convert back to number
        }
      }
      
      setStats(prev => ({
        ...prev,
        totalServices: servicesData.length,
        operationalServices: operational,
        avgUptime: avgUptime,
      }));
    } catch (error) {
      console.error('Error loading services:', error);
    }
  };

  const loadIncidents = async () => {
    try {
      const response = await incidentAPI.getByOrganization(organizationId, { 
        status: 'investigating,identified,monitoring',
        limit: 10
      });
      const incidentsData = response.data.data.incidents || [];
      
      // Separate incidents and maintenances
      const activeIncidents = incidentsData.filter(i => i.type === 'incident');
      const activeMaintenances = incidentsData.filter(i => i.type === 'maintenance');
      
      setIncidents(activeIncidents);
      setMaintenances(activeMaintenances);
      
      setStats(prev => ({
        ...prev,
        activeIncidents: activeIncidents.length,
      }));
    } catch (error) {
      console.error('Error loading incidents:', error);
    }
  };

  const loadRecentIncidents = async () => {
    try {
      const response = await incidentAPI.getByOrganization(organizationId, { 
        limit: 20,
        orderBy: 'created_at',
        orderDirection: 'DESC'
      });
      setRecentIncidents(response.data.data.incidents || []);
    } catch (error) {
      console.error('Error loading recent incidents:', error);
    }
  };

  const calculateOverallStatus = (servicesData) => {
    if (!servicesData.length) {
      setOverallStatus('operational');
      return;
    }

    const statusPriority = {
      'major_outage': 5,
      'partial_outage': 4,
      'degraded_performance': 3,
      'under_maintenance': 2,
      'operational': 1,
    };

    const highestPriority = Math.max(...servicesData.map(s => statusPriority[s.status] || 1));
    const status = Object.keys(statusPriority).find(key => statusPriority[key] === highestPriority);
    setOverallStatus(status || 'operational');
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case SERVICE_STATUS.OPERATIONAL:
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case SERVICE_STATUS.DEGRADED_PERFORMANCE:
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case SERVICE_STATUS.PARTIAL_OUTAGE:
        return <AlertCircle className="h-5 w-5 text-orange-500" />;
      case SERVICE_STATUS.MAJOR_OUTAGE:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case SERVICE_STATUS.UNDER_MAINTENANCE:
        return <Settings className="h-5 w-5 text-blue-500" />;
      default:
        return <Activity className="h-5 w-5 text-gray-500" />;
    }
  };

  const getOverallStatusMessage = () => {
    switch (overallStatus) {
      case 'major_outage':
        return 'Major service outage affecting multiple systems';
      case 'partial_outage':
        return 'Some services are experiencing issues';
      case 'degraded_performance':
        return 'Some services may be running slower than usual';
      case 'under_maintenance':
        return 'Scheduled maintenance is currently in progress';
      case 'operational':
      default:
        return 'All systems are operational';
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
          <div className="py-8">
            <h1 className="text-2xl font-semibold text-gray-900">Status Overview</h1>
            <p className="text-sm text-gray-600 mt-1">Monitor all your services and incidents in one place</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Overall Status */}
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {getStatusIcon(overallStatus)}
              <div className="ml-3">
                <h2 className="text-lg font-semibold text-gray-900">
                  System Status: <span className={getStatusBadgeClasses(overallStatus).split(' ').slice(-1)[0]}>
                    {getStatusLabel(overallStatus)}
                  </span>
                </h2>
                <p className="text-sm text-gray-600">{getOverallStatusMessage()}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Last updated</p>
              <p className="text-sm font-medium">{formatDateTime(new Date())}</p>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <Activity className="h-8 w-8 text-blue-500" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.totalServices}</p>
                <p className="text-sm text-gray-600">Total Services</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.operationalServices}</p>
                <p className="text-sm text-gray-600">Operational</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <AlertCircle className="h-8 w-8 text-red-500" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">{stats.activeIncidents}</p>
                <p className="text-sm text-gray-600">Active Incidents</p>
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-green-500" />
              <div className="ml-3">
                <p className="text-2xl font-semibold text-gray-900">
                  {isNaN(stats.avgUptime) ? generateFallbackUptime() : stats.avgUptime}%
                </p>
                <p className="text-sm text-gray-600">Avg Uptime</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Services Status */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Services Status</h3>
              <p className="text-sm text-gray-600">Current status of all your services</p>
            </div>
            <div className="p-6">
              {services.length === 0 ? (
                <div className="text-center py-8">
                  <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No services found</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {services.map((service) => (
                    <div key={service.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                      <div className="flex items-center">
                        <div className={`${getStatusDotClasses(service.status)} h-3 w-3 rounded-full mr-3`}></div>
                        <div>
                          <h4 className="font-medium text-gray-900">{service.name}</h4>
                          {service.description && (
                            <p className="text-sm text-gray-600">{service.description}</p>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={getStatusBadgeClasses(service.status)}>
                          {getStatusLabel(service.status)}
                        </span>
                        {service.url && (
                          <div className="mt-1">
                            <a
                              href={service.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                            >
                              <ExternalLink className="h-3 w-3 mr-1" />
                              Visit
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Active Incidents & Maintenances */}
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Active Issues</h3>
              <p className="text-sm text-gray-600">Current incidents and scheduled maintenances</p>
            </div>
            <div className="p-6">
              {incidents.length === 0 && maintenances.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-400 mx-auto mb-4" />
                  <p className="text-gray-600">No active incidents or maintenances</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {[...incidents, ...maintenances].map((incident) => (
                    <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center">
                            {incident.type === 'maintenance' ? (
                              <Calendar className="h-4 w-4 text-blue-500 mr-2" />
                            ) : (
                              <AlertCircle className="h-4 w-4 text-red-500 mr-2" />
                            )}
                            <h4 className="font-medium text-gray-900">{incident.title}</h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{incident.description}</p>
                          <div className="flex items-center mt-2 space-x-4">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              incident.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                              incident.status === 'identified' ? 'bg-orange-100 text-orange-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                            </span>
                            <span className="text-xs text-gray-500">
                              {formatRelativeTime(incident.startedAt || incident.createdAt)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Recent Incidents Timeline */}
        <div className="bg-white rounded-lg border border-gray-200">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <p className="text-sm text-gray-600">Timeline of recent incidents and status changes</p>
          </div>
          <div className="p-6">
            {recentIncidents.length === 0 ? (
              <div className="text-center py-8">
                <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">No recent activity</p>
              </div>
            ) : (
              <div className="flow-root">
                <ul className="-mb-8">
                  {recentIncidents.slice(0, 10).map((incident, index) => (
                    <li key={incident.id}>
                      <div className="relative pb-8">
                        {index !== recentIncidents.slice(0, 10).length - 1 && (
                          <span
                            className="absolute top-5 left-5 -ml-px h-full w-0.5 bg-gray-200"
                            aria-hidden="true"
                          />
                        )}
                        <div className="relative flex items-start space-x-3">
                          <div className="relative">
                            {incident.status === 'resolved' ? (
                              <div className="h-10 w-10 bg-green-500 rounded-full flex items-center justify-center">
                                <CheckCircle className="h-5 w-5 text-white" />
                              </div>
                            ) : (
                              <div className="h-10 w-10 bg-red-500 rounded-full flex items-center justify-center">
                                <AlertCircle className="h-5 w-5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <div>
                              <div className="text-sm">
                                <p className="font-medium text-gray-900">{incident.title}</p>
                              </div>
                              <p className="mt-0.5 text-sm text-gray-500">
                                {formatDateTime(incident.startedAt || incident.createdAt)}
                              </p>
                            </div>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>{incident.description}</p>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                                incident.status === 'monitoring' ? 'bg-blue-100 text-blue-800' :
                                incident.status === 'identified' ? 'bg-orange-100 text-orange-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default StatusOverview;
