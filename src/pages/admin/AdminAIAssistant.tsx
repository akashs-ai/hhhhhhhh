import React from 'react';
import { UserItem } from '../../types';
import { AIAssistantView } from '../../components/AIAssistantView';

interface AdminAIAssistantProps {
  currentUser: UserItem;
}

export const AdminAIAssistant: React.FC<AdminAIAssistantProps> = ({ currentUser }) => {
  return <AIAssistantView currentUser={currentUser} roleType="admin" />;
};
