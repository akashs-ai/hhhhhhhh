import React from 'react';
import { UserItem } from '../../types';
import { AIAssistantView } from '../../components/AIAssistantView';

interface FacultyAIAssistantProps {
  currentUser: UserItem;
  onNavigateTab?: (tab: string) => void;
}

export const FacultyAIAssistant: React.FC<FacultyAIAssistantProps> = ({ currentUser }) => {
  return <AIAssistantView currentUser={currentUser} roleType="faculty" />;
};
