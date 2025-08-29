import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { 
  Calendar, 
  Clock, 
  AlertCircle, 
  CheckCircle, 
  Settings,
  TrendingUp,
  Filter,
  Search
} from 'lucide-react';
import { incidentAPI, handleApiError } from '../../utils/api';
import { useSocket } from '../../contexts/SocketContext';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import { 
  formatRelativeTime, 
  formatDateTime,
  formatDate
} from '../../utils/helpers';
import { INCIDENT_STATUS, INCIDENT_SEVERITY } from '../../utils/constants';
import toast from 'react-hot-toast';

const IncidentsTimeline = () => {
  const { organizationId } = useParams();
  const [timelineItems, setTimelineItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, incidents, maintenances, service_changes
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const { useRealtimeUpdates } = useSocket();

  // Enable real-time updates for this organization
  useRealtimeUpdates(organizationId, null);

  useEffect(() => {
    if (organizationId) {
      loadIncidents();
    }
  }, [organizationId, filter, statusFilter, searchQuery]);

  const loadIncidents = async () => {
    try {
      setIsLoading(true);
      const params = {
        limit: 50,
      };

      const response = await incidentAPI.getTimeline(organizationId, params);
      let items = response.data?.data?.timelineItems || [];

      // Apply filters
      if (filter === 'incidents') {
        items = items.filter(item => item.type === 'incident' && item.data?.type === 'incident');
      } else if (filter === 'maintenances') {
        items = items.filter(item => item.type === 'incident' && item.data?.type === 'maintenance');
      } else if (filter === 'service_changes') {
        items = items.filter(item => item.type === 'service_status_change');
      }

      if (statusFilter !== 'all') {
        items = items.filter(item => {
          if (item.type === 'incident') {
            return item.data?.status === statusFilter;
          }
          return true; // Don't filter service status changes by incident status
        });
      }

      // Apply search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        items = items.filter(item => {
          if (item.type === 'incident') {
            return item.data?.title?.toLowerCase().includes(query) ||
                   item.data?.description?.toLowerCase().includes(query);
          } else if (item.type === 'service_status_change') {
            return item.data?.service?.name?.toLowerCase().includes(query);
          }
          return false;
        });
      }

      setTimelineItems(items);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'monitoring':
        return <TrendingUp className="h-5 w-5 text-blue-500" />;
      case 'identified':
        return <Settings className="h-5 w-5 text-orange-500" />;
      case 'investigating':
      default:
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  const getTypeIcon = (type) => {
    switch (type) {
      case 'maintenance':
        return <Settings className="h-4 w-4 text-blue-500" />;
      case 'incident':
      default:
        return <AlertCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'major':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'minor':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'monitoring':
        return 'bg-blue-100 text-blue-800';
      case 'identified':
        return 'bg-orange-100 text-orange-800';
      case 'investigating':
      default:
        return 'bg-red-100 text-red-800';
    }
  };

  const groupTimelineByDate = (items) => {
    const grouped = {};
    items.forEach(item => {
      const date = formatDate(item.timestamp);
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(item);
    });
    return grouped;
  };

  const renderTimelineItem = (item, index, dateItems) => {
    if (item.type === 'incident') {
      const incident = item.data;
      return (
        <div
          key={item.id}
          className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
        >
          {/* Timeline connector */}
          {index !== dateItems.length - 1 && (
            <div className="absolute -left-8 top-12 w-0.5 h-full bg-gray-200"></div>
          )}

          {/* Timeline dot */}
          <div className="absolute -left-10 top-6">
            <div className={`flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-sm ${
              incident.status === 'resolved' ? 'bg-green-500' :
              incident.status === 'monitoring' ? 'bg-blue-500' :
              incident.status === 'identified' ? 'bg-orange-500' :
              'bg-red-500'
            }`}>
              {incident.status === 'resolved' && <CheckCircle className="h-3 w-3 text-white" />}
              {incident.status !== 'resolved' && <div className="w-2 h-2 bg-white rounded-full"></div>}
            </div>
          </div>

          {/* Incident content */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                {getTypeIcon(incident.type)}
                <h3 className="text-lg font-semibold text-gray-900 ml-2">
                  {incident.title}
                </h3>
              </div>
              
              {incident.description && (
                <p className="text-gray-700 mb-4">
                  {incident.description}
                </p>
              )}

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(incident.status)}`}>
                  {incident.status.charAt(0).toUpperCase() + incident.status.slice(1)}
                </span>
                
                {incident.severity && (
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getSeverityColor(incident.severity)}`}>
                    {incident.severity.charAt(0).toUpperCase() + incident.severity.slice(1)} Severity
                  </span>
                )}

                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {incident.type === 'maintenance' ? 'Maintenance' : 'Incident'}
                </span>
              </div>

              {/* Affected Services */}
              {incident.affectedServices && incident.affectedServices.length > 0 && (
                <div className="mb-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Affected Services:</p>
                  <div className="flex flex-wrap gap-2">
                    {incident.affectedServices.map((service) => (
                      <span
                        key={service.id}
                        className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-50 text-blue-700 border border-blue-200"
                      >
                        {service.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Timeline info */}
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  Started {formatRelativeTime(incident.started_at || incident.created_at)}
                </span>
                {incident.resolved_at && (
                  <span className="ml-4">
                    • Resolved {formatRelativeTime(incident.resolved_at)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Latest Update */}
          {incident.updates && incident.updates.length > 0 && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="bg-gray-50 rounded-lg p-4">
                <p className="text-sm font-medium text-gray-900 mb-2">Latest Update</p>
                <p className="text-sm text-gray-700 mb-2">
                  {incident.updates[0].description || incident.updates[0].title}
                </p>
                <p className="text-xs text-gray-500">
                  {formatRelativeTime(incident.updates[0].created_at)}
                </p>
              </div>
            </div>
          )}
        </div>
      );
    } else if (item.type === 'service_status_change') {
      const statusChange = item.data;
      return (
        <div
          key={item.id}
          className="relative bg-white rounded-lg border border-gray-200 p-6 hover:shadow-sm transition-shadow"
        >
          {/* Timeline connector */}
          {index !== dateItems.length - 1 && (
            <div className="absolute -left-8 top-12 w-0.5 h-full bg-gray-200"></div>
          )}

          {/* Timeline dot */}
          <div className="absolute -left-10 top-6">
            <div className="flex items-center justify-center w-6 h-6 rounded-full border-2 border-white shadow-sm bg-blue-500">
              <Settings className="h-3 w-3 text-white" />
            </div>
          </div>

          {/* Service status change content */}
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center mb-2">
                <TrendingUp className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-semibold text-gray-900 ml-2">
                  Service Status Changed
                </h3>
              </div>
              
              <p className="text-gray-700 mb-4">
                <span className="font-medium">{statusChange.service?.name}</span> status changed from{' '}
                <span className="font-medium text-orange-600">
                  {statusChange.oldStatus?.replace(/_/g, ' ') || 'unknown'}
                </span> to{' '}
                <span className="font-medium text-green-600">
                  {statusChange.newStatus?.replace(/_/g, ' ')}
                </span>
              </p>

              <div className="flex flex-wrap items-center gap-2 mb-4">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  Service Change
                </span>
              </div>

              {/* Timeline info */}
              <div className="flex items-center text-sm text-gray-500">
                <Clock className="h-4 w-4 mr-1" />
                <span>
                  Changed {formatRelativeTime(statusChange.created_at)}
                </span>
                {statusChange.changedByUser && (
                  <span className="ml-4">
                    • by {statusChange.changedByUser.first_name} {statusChange.changedByUser.last_name}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const groupedTimelineItems = groupTimelineByDate(timelineItems);

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
            <h1 className="text-2xl font-semibold text-gray-900">Incidents Timeline</h1>
            <p className="text-sm text-gray-600 mt-1">View the history of all incidents and status changes</p>
          </div>
        </div>
      </div>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 mb-8">
          <div className="flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search incidents..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 form-input"
                />
              </div>
            </div>

            {/* Type Filter */}
            <div className="flex items-center space-x-2">
              <Filter className="h-4 w-4 text-gray-500" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="form-input text-sm min-w-32"
              >
                <option value="all">All Types</option>
                <option value="incidents">Incidents Only</option>
                <option value="maintenances">Maintenance Only</option>
                <option value="service_changes">Service Changes</option>
              </select>
            </div>

            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-input text-sm min-w-32"
            >
              <option value="all">All Status</option>
              <option value="investigating">Investigating</option>
              <option value="identified">Identified</option>
              <option value="monitoring">Monitoring</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
        </div>

        {/* Timeline */}
        {Object.keys(groupedTimelineItems).length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No timeline items found
            </h3>
            <p className="text-gray-600">
              {searchQuery.trim() ? 'Try adjusting your search or filters.' : 'There are no timeline items to display.'}
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(groupedTimelineItems).map(([date, dateItems]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center mb-6">
                  <div className="flex-shrink-0">
                    <div className="flex items-center justify-center w-10 h-10 bg-gray-100 rounded-full">
                      <Calendar className="h-5 w-5 text-gray-600" />
                    </div>
                  </div>
                  <div className="ml-4">
                    <h2 className="text-lg font-semibold text-gray-900">{date}</h2>
                    <p className="text-sm text-gray-500">{dateItems.length} item{dateItems.length !== 1 ? 's' : ''}</p>
                  </div>
                  <div className="flex-1 ml-6 border-t border-gray-300"></div>
                </div>

                {/* Timeline items for this date */}
                <div className="ml-14 space-y-6">
                  {dateItems.map((item, index) => renderTimelineItem(item, index, dateItems))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default IncidentsTimeline;
