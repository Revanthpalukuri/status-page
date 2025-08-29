import React from 'react';
import { useParams } from 'react-router-dom';

const PublicIncidentPage = () => {
  const { slug, incidentId } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">
          Incident Details
        </h1>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <p className="text-gray-600">
            Incident details for Organization: {slug}, Incident: {incidentId}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            This page is under construction. Full implementation coming soon.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PublicIncidentPage;
