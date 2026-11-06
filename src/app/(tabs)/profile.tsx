import React from 'react';
import { ProfileView } from '@/components/ProfileView';
import { useAuth } from '@/lib/auth';

export default function MyProfile() {
  const { session } = useAuth();
  if (!session) return null;
  return <ProfileView userId={session.user.id} isTab />;
}
