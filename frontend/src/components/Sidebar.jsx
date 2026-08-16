import React, { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom';
import useThemeStore from '../store/themeStore';
import useUserStore from '../store/useUserStore';
import useLayoutStore from '../store/layoutStore';
import { motion } from 'framer-motion'
import {
  HiOutlineChatBubbleLeftRight,
  HiOutlineSignal,
  HiOutlinePhone,
  HiOutlineBookmark,
  HiOutlineCog6Tooth,
  HiChevronDown,
} from 'react-icons/hi2';
import { BsChatDotsFill } from 'react-icons/bs';

const navItems = [
  { id: 'chats', label: 'Chats', icon: HiOutlineChatBubbleLeftRight, path: '/' },
  { id: 'status', label: 'Status', icon: HiOutlineSignal, path: '/status' },
  { id: 'calls', label: 'Calls', icon: HiOutlinePhone, path: null },
  // { id: 'contacts', label: 'Contacts', icon: HiOutlineUserGroup, path: '/user-profile' },
  { id: 'saved', label: 'Saved', icon: HiOutlineBookmark, path: null },
  { id: 'setting', label: 'Settings', icon: HiOutlineCog6Tooth, path: '/setting' },
];

export default function Sidebar() {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const { activeTab, setActiveTab, selectedContact } = useLayoutStore();

  const isDark = theme === 'dark';

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    if (location.pathname === '/') setActiveTab("chats");
    else if (location.pathname === '/status') setActiveTab("status");
    // else if (location.pathname === '/user-profile') setActiveTab("contacts");
    else if (location.pathname === '/setting') setActiveTab("setting");
  }, [location, setActiveTab]);

  if (isMobile && selectedContact) return null;

  const NavLink = ({ item }) => {
    const isActive = activeTab === item.id;
    const Icon = item.icon;

    const baseClass = `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
      isActive
        ? isDark
          ? "bg-chatriv-purple/20 text-chatriv-purple-muted"
          : "bg-chatriv-purple-light text-chatriv-purple"
        : isDark
          ? "text-gray-400 hover:bg-white/5 hover:text-gray-200"
          : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
    }`;

    const content = (
      <>
        <Icon className={`h-5 w-5 flex-shrink-0 ${isActive ? (isDark ? "text-chatriv-purple-muted" : "text-chatriv-purple") : ""}`} />
        {!isMobile && <span className="text-sm font-medium">{item.label}</span>}
      </>
    );

    if (item.path) {
      return (
        <Link to={item.path} className={baseClass}>
          {content}
        </Link>
      );
    }

    return (
      <button className={`${baseClass} w-full cursor-default opacity-60`} disabled>
        {content}
      </button>
    );
  };

  if (isMobile) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`fixed bottom-0 left-0 right-0 h-16 z-50 flex items-center justify-around px-2 border-t ${
          isDark ? "bg-surface-sidebar-dark border-gray-800" : "bg-surface-sidebar-light border-gray-200"
        }`}
      >
        {navItems.filter(i => i.path).slice(0, 4).map((item) => (
          <Link
            key={item.id}
            to={item.path}
            className={`p-2 rounded-xl ${
              activeTab === item.id
                ? isDark ? "text-chatriv-purple-muted" : "text-chatriv-purple"
                : isDark ? "text-gray-400" : "text-gray-600"
            }`}
          >
            <item.icon className="h-6 w-6" />
          </Link>
        ))}
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`w-56 h-screen flex flex-col py-5 px-3 border-r flex-shrink-0 ${
        isDark
          ? "bg-surface-sidebar-dark border-gray-800"
          : "bg-surface-sidebar-light border-gray-200"
      }`}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-3 mb-8">
        <div className="w-9 h-9 rounded-xl bg-chatriv-purple flex items-center justify-center shadow-soft">
          <BsChatDotsFill className="h-5 w-5 text-white" />
        </div>
        <span className={`text-lg font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
          Chatriv
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-1 flex-1">
        {navItems.map((item) => (
          <NavLink key={item.id} item={item} />
        ))}
      </nav>

      {/* User profile */}
      <Link
        to="/user-profile"
        className={`flex items-center gap-3 px-3 py-3 mt-4 rounded-xl transition-colors ${
          isDark ? "hover:bg-white/5" : "hover:bg-gray-100"
        }`}
      >
        {user?.profilePicture ? (
          <img src={user.profilePicture} alt={user.username} className="w-9 h-9 rounded-full object-cover" />
        ) : (
          <div className="w-9 h-9 rounded-full bg-chatriv-purple/20 flex items-center justify-center">
            <span className="text-sm font-semibold text-chatriv-purple">
              {user?.username?.charAt(0)?.toUpperCase() || "U"}
            </span>
          </div>
        )}
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
            {user?.username || "User"}
          </p>
          <p className="text-xs text-green-500 font-medium">Online</p>
        </div>
        <HiChevronDown className={`h-4 w-4 flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
      </Link>
    </motion.div>
  );
}
