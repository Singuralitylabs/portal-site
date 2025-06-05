'use client';

import { useUser } from '@clerk/nextjs';
import { ProfileTemplate } from './components/Template';
import { useEffect, useState } from 'react';

export default function ProfilePage() {
  const { user } = useUser();
  const [joinedDate, setJoinedDate] = useState<string>('');

  useEffect(() => {
    if (user?.createdAt) {
      const date = new Date(user.createdAt);
      setJoinedDate(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`);
    }
  }, [user]);

  if (!user) {
    return <div>ユーザー情報を読み込み中...</div>;
  }

  const userData = {
    name: user.fullName || '',
    role: 'メンバー',
    joinedAt: joinedDate,
    bio: user.publicMetadata.bio as string || '',
  };

  return <ProfileTemplate user={userData} />;
}
