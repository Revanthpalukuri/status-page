import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Building2, Users, Activity, Settings, LogOut, AlertTriangle, ExternalLink, Clock } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { organizationAPI, handleApiError } from '../../utils/api';
import Button from '../../components/ui/Button';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import CreateOrganizationModal from '../../components/dashboard/CreateOrganizationModal';
import JoinOrganizationModal from '../../components/dashboard/JoinOrganizationModal';
import { formatRelativeTime } from '../../utils/helpers';
import toast from 'react-hot-toast';

const DashboardPage = () => {
  const [organizations, setOrganizations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const { user, logout } = useAuth();

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      setIsLoading(true);
      const response = await organizationAPI.getAll();
      setOrganizations(response.data.data.organizations);
    } catch (error) {
      const errorInfo = handleApiError(error);
      toast.error(errorInfo.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOrganizationCreated = (newOrganization) => {
    setOrganizations(prev => [...prev, {
      ...newOrganization,
      role: 'admin',
      isOwner: true,
    }]);
    setShowCreateModal(false);
  };

  const handleOrganizationJoined = (organization) => {
    // Reload organizations to get the updated list with proper role info
    loadOrganizations();
    setShowJoinModal(false);
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
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-semibold text-gray-900">
                Status Page Dashboard
              </h1>
            </div>
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">
                {user?.firstName} {user?.lastName}
              </span>
              <button
                onClick={logout}
                className="text-gray-500 hover:text-gray-700 p-2"
                title="Logout"
              >
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.firstName}!
          </h2>
          <p className="text-gray-600">
            Manage your status pages and monitor your services.
          </p>
        </div>

        {/* Organizations Section */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-semibold text-gray-900">
            Your Organizations
          </h3>
          <div className="flex items-center space-x-3">
            {user?.role === 'admin' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
                className="flex items-center"
              >
                <Plus className="h-4 w-4 mr-2" />
                Create Organization
              </Button>
            )}
            {user?.role !== 'admin' && (
              <Button
                variant="primary"
                onClick={() => setShowJoinModal(true)}
                className="flex items-center"
              >
                <Building2 className="h-4 w-4 mr-2" />
                Join Organization
              </Button>
            )}
          </div>
        </div>

        {organizations.length === 0 ? (
          <div className="text-center py-12">
            <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No organizations yet
            </h3>
            <p className="text-gray-600 mb-6">
              {user?.role === 'admin' 
                ? 'Create your first organization to get started with status monitoring.'
                : 'You don\'t have access to any organizations yet. Join an existing organization to get started.'
              }
            </p>
            {user?.role === 'admin' && (
              <Button
                variant="primary"
                onClick={() => setShowCreateModal(true)}
              >
                Create Your First Organization
              </Button>
            )}
            {user?.role !== 'admin' && (
              <Button
                variant="primary"
                onClick={() => setShowJoinModal(true)}
              >
                <Building2 className="h-4 w-4 mr-2" />
                Join an Organization
              </Button>
            )}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {organizations.map((org) => (
              <div
                key={org.id}
                className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    {org.logoUrl ? (
                      <img
                        src={org.logoUrl}
                        alt={`${org.name} logo`}
                        className="h-10 w-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded-lg bg-primary-100 flex items-center justify-center">
                        <Building2 className="h-5 w-5 text-primary-600" />
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                    org.isOwner
                      ? 'bg-blue-100 text-blue-800'
                      : org.role === 'admin'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {org.isOwner ? 'Owner' : org.role}
                  </span>
                </div>

                <h4 className="text-lg font-semibold text-gray-900 mb-2">
                  {org.name}
                </h4>
                <p className="text-sm text-gray-600 mb-4">
                  {org.description || 'No description provided'}
                </p>

                <div className="text-xs text-gray-500 mb-4">
                  Created {formatRelativeTime(org.createdAt)}
                  {(user?.role === 'admin' || org.isOwner || org.role === 'admin') && org.accessCode && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-center">
                      <p className="text-xs text-blue-700 font-medium">Access Code</p>
                      <p className="text-sm text-blue-800 font-mono font-bold tracking-wide">{org.accessCode}</p>
                      <p className="text-xs text-blue-600">Share with team members</p>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Link
                    to={`/dashboard/organizations/${org.id}/status`}
                    className="w-full"
                  >
                    <Button variant="primary" size="sm" className="w-full">
                      <Activity className="h-4 w-4 mr-2" />
                      Overview
                    </Button>
                  </Link>
                  <Link
                    to={`/dashboard/organizations/${org.id}/services`}
                    className="w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Settings className="h-4 w-4 mr-2" />
                      Services
                    </Button>
                  </Link>
                  <Link
                    to={`/dashboard/organizations/${org.id}/timeline`}
                    className="w-full"
                  >
                    <Button variant="outline" size="sm" className="w-full">
                      <Clock className="h-4 w-4 mr-2" />
                      Timeline
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick Actions */}
        {organizations.length > 0 && (
          <div className="mt-12">
            <h3 className="text-lg font-semibold text-gray-900 mb-6">
              Quick Actions
            </h3>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Users className="h-6 w-6 text-primary-600 mb-2" />
                <h4 className="font-medium text-gray-900">Team Management</h4>
                <p className="text-sm text-gray-600">Invite and manage team members</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Activity className="h-6 w-6 text-green-600 mb-2" />
                <h4 className="font-medium text-gray-900">Service Monitoring</h4>
                <p className="text-sm text-gray-600">Track service uptime and status</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Settings className="h-6 w-6 text-orange-600 mb-2" />
                <h4 className="font-medium text-gray-900">Incident Management</h4>
                <p className="text-sm text-gray-600">Report and track incidents</p>
              </div>
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <Building2 className="h-6 w-6 text-purple-600 mb-2" />
                <h4 className="font-medium text-gray-900">Status Pages</h4>
                <p className="text-sm text-gray-600">Public status communication</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Create Organization Modal */}
      {showCreateModal && (
        <CreateOrganizationModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onOrganizationCreated={handleOrganizationCreated}
        />
      )}

      {/* Join Organization Modal */}
      {showJoinModal && (
        <JoinOrganizationModal
          isOpen={showJoinModal}
          onClose={() => setShowJoinModal(false)}
          onSuccess={handleOrganizationJoined}
        />
      )}
    </div>
  );
};

export default DashboardPage;
