"use client";

import { useOnlineUsers } from "../../../../shared/hooks/useOnlineUsers";
import { UserProfilePresenter } from "../../components/presenters/UserProfilePresenter";
import { useUserProfile } from "../../hooks/useUserProfile";

export const UserProfilePageContainer: React.FC = () => {
  const { userProfile, isLoading } = useUserProfile();
  const onlineUsers = useOnlineUsers();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-[#8f81fc] to-[#ff6ea2]">
        <div className="text-white text-xl">読み込み中...</div>
      </div>
    );
  }

  return (
    <UserProfilePresenter userProfile={userProfile} onlineUsers={onlineUsers} />
  );
};
