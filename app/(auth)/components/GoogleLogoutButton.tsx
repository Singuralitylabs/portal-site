"use client";

import { useClerk } from "@clerk/nextjs";
import { useState } from "react";

const GoogleLogoutButton = () => {
  const { signOut } = useClerk();
  const [isSigningOut, setIsSigningOut] = useState(false);

  const handleLogout = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
    } catch (error) {
      console.error("ログアウトエラー:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <button
      className="flex items-center gap-3 px-6 py-3 bg-white border-2 border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
      onClick={handleLogout}
      disabled={isSigningOut}
    >
      <svg viewBox="0 0 24 24" className="w-6 h-6" xmlns="http://www.w3.org/2000/svg">
        <path
          fill="#EA4335"
          d="M16 13v-2H7V8l-5 4 5 4v-3zM20 3h-8v2h8v14h-8v2h8c1.1 0 2-.9 2-2V5c0-1.1-.9-2-2-2z"
        />
      </svg>
      {isSigningOut ? "ログアウト中..." : "Googleでログアウト"}
    </button>
  );
};

export default GoogleLogoutButton;
