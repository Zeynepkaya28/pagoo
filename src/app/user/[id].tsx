import React from 'react';
import { useLocalSearchParams } from 'expo-router';
import { ProfileView } from '@/components/ProfileView';

export default function UserScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <ProfileView userId={id} />;
}
