import React, { useState } from "react";
import { LogOut, Settings, Bell } from "lucide-react";

interface HeaderProps {
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onLogout }) => {
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="glass sticky top-0 z-50 px-6 py-4 border-b border-slate-700/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-lg flex items-center justify-center">
            <span className="font-bold text-white">KK</span>
          </div>
          <h1 className="text-xl font-bold text-gray-100">KaryaKavach Admin</h1>
          <span className="text-xs bg-green-900/30 text-green-300 px-2 py-1 rounded-full ml-4">
            🟢 LIVE
          </span>
        </div>

        <div className="flex items-center gap-4">
          <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors relative">
            <Bell size={20} className="text-gray-300" />
            <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
          </button>

          <button
            onClick={() => setShowMenu(!showMenu)}
            className="p-2 hover:bg-slate-700/50 rounded-lg transition-colors"
          >
            <Settings size={20} className="text-gray-300" />
          </button>

          {showMenu && (
            <div className="absolute top-16 right-6 bg-slate-800 border border-slate-700 rounded-lg shadow-lg overflow-hidden w-48">
              <button
                onClick={() => {
                  setShowMenu(false);
                  onLogout();
                }}
                className="w-full px-4 py-3 text-left text-red-400 hover:bg-red-900/20 flex items-center gap-2 transition-colors"
              >
                <LogOut size={16} />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
