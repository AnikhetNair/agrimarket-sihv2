import React from 'react';
import { useAuth } from '../../context/AuthContext';
import { FpoDisputeWorkspace } from '../../components/disputes/FpoDisputeWorkspace';

export const FpoDisputesPage: React.FC = () => {
  const { user } = useAuth();

  return (
    <div id="fpo-disputes-page">
      <FpoDisputeWorkspace
        currentUser={
          user || {
            id: 'org-fpo-1',
            name: 'Sahyadri Farmers Producer Company',
            role: 'FPO',
          }
        }
      />
    </div>
  );
};
