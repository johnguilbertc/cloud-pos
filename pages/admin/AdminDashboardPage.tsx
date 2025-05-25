
import React from 'react';

const AdminDashboardPage: React.FC = () => {
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-3xl font-bold text-primary mb-6">Admin Dashboard</h1>
      <div className="bg-surface p-6 rounded-lg shadow-lg">
        <p className="text-textSecondary">
          The Admin Dashboard will be implemented here. This section will provide an overview of:
        </p>
        <ul className="list-disc list-inside text-textSecondary mt-4 space-y-2">
          <li>Total sales and key metrics.</li>
          <li>Popular items and categories.</li>
          <li>Low stock alerts.</li>
          <li>Quick links to other admin sections.</li>
        </ul>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
