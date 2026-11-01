import React from 'react';
import { UserItem } from '../../types';
import { AIAssistantView } from '../../components/AIAssistantView';

interface StudentAIAssistantProps {
  currentUser: UserItem;
}

export const StudentAIAssistant: React.FC<StudentAIAssistantProps> = ({ currentUser }) => {
  return <AIAssistantView currentUser={currentUser} roleType="student" />;
};
