import React, { useState } from 'react'
import useThemeStore from '../../store/themeStore';
import { logoutUser } from '../../services/user.service'
import useUserStore from '../../store/useUserStore';
import { toast } from 'react-toastify'
import Layout from '../../components/Layout';
import { FaSearch, FaSignOutAlt } from 'react-icons/fa';
import {
  HiOutlineUser,
  HiOutlineChatBubbleLeftRight,
  HiOutlineBell,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
  HiOutlineMoon,
  HiOutlineSun,
  HiChevronRight,
} from 'react-icons/hi2';
import { Link, useNavigate } from 'react-router-dom';

const menuSections = [
  {
    title: 'Account',
    items: [
      { icon: HiOutlineUser, label: 'Profile', href: '/user-profile', desc: 'Name, photo, about' },
      { icon: HiOutlineChatBubbleLeftRight, label: 'Chats', href: '/', desc: 'Wallpaper, history' },
      { icon: HiOutlineBell, label: 'Notifications', href: null, desc: 'Message, group alerts' },
    ],
  },
  {
    title: 'Privacy & Support',
    items: [
      { icon: HiOutlineShieldCheck, label: 'Privacy', href: null, desc: 'Block, last seen' },
      { icon: HiOutlineQuestionMarkCircle, label: 'Help', href: null, desc: 'FAQ, contact us' },
    ],
  },
];

export default function Setting() {
  const [isThemeDialogOpen, setIsThemeDialogOpen] = useState(false);
  const { theme } = useThemeStore();
  const { user, clearUser } = useUserStore();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const toggleThemeDialog = () => setIsThemeDialogOpen(!isThemeDialogOpen);

  const handleLogout = async () => {
    try {
      await logoutUser();
      clearUser();
      navigate('/');
      toast.success("Logged out successfully");
    } catch (error) {
      console.error("Failed to logout user", error);
    }
  }

  const MenuItem = ({ item }) => {
    const content = (
      <>
        <div className={`p-2 rounded-xl flex-shrink-0 ${
          isDark ? "bg-chatriv-purple/15 text-chatriv-purple-muted" : "bg-chatriv-purple-light text-chatriv-purple"
        }`}>
          <item.icon className="h-5 w-5" />
        </div>
        <div className="flex-1 min-w-0 text-left">
          <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>{item.label}</p>
          <p className={`text-xs truncate ${isDark ? "text-gray-500" : "text-gray-400"}`}>{item.desc}</p>
        </div>
        <HiChevronRight className={`h-4 w-4 flex-shrink-0 ${isDark ? "text-gray-600" : "text-gray-300"}`} />
      </>
    );

    const className = `w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
      isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
    }`;

    if (item.href) {
      return <Link to={item.href} className={className}>{content}</Link>;
    }
    return <button className={`${className} opacity-60 cursor-default`} disabled>{content}</button>;
  };

  return (
    <Layout isThemeDialogeOpen={isThemeDialogOpen} toggleThemeDialoge={toggleThemeDialog}>
      <div className={`w-full h-screen flex flex-col border-r ${
        isDark ? "bg-surface-list-dark border-gray-800" : "bg-surface-list-light border-gray-200"
      }`}>
        {/* Header */}
        <div className={`px-4 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <h1 className={`text-lg font-semibold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
            Settings
          </h1>
          <div className="relative">
            <FaSearch className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`} />
            <input
              type="text"
              placeholder="Search settings..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 ${
                isDark
                  ? "bg-surface-input-dark text-white placeholder-gray-500 border border-gray-800"
                  : "bg-surface-input-light text-gray-900 placeholder-gray-400 border border-gray-200"
              }`}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
          {/* Profile card */}
          <Link
            to="/user-profile"
            className={`flex items-center gap-3 p-3 mb-4 rounded-xl transition-colors ${
              isDark ? "bg-white/5 hover:bg-white/10" : "bg-chatriv-purple-light/50 hover:bg-chatriv-purple-light"
            }`}
          >
            <img
              src={user?.profilePicture}
              alt="profile"
              className="w-14 h-14 rounded-full object-cover ring-2 ring-chatriv-purple/30"
            />
            <div className="flex-1 min-w-0">
              <h2 className={`font-semibold truncate ${isDark ? "text-white" : "text-gray-900"}`}>
                {user?.username}
              </h2>
              <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                {user?.about || "Hey there! I'm using Chatriv."}
              </p>
            </div>
            <HiChevronRight className={`h-4 w-4 flex-shrink-0 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
          </Link>

          {/* Menu sections */}
          {menuSections.map((section) => (
            <div key={section.title} className="mb-4">
              <p className={`text-xs font-semibold uppercase tracking-wider px-3 mb-1 ${
                isDark ? "text-gray-500" : "text-gray-400"
              }`}>
                {section.title}
              </p>
              <div className={`rounded-xl overflow-hidden ${
                isDark ? "bg-white/[0.03]" : "bg-gray-50"
              }`}>
                {section.items.map((item) => (
                  <MenuItem key={item.label} item={item} />
                ))}
              </div>
            </div>
          ))}

          {/* Theme toggle */}
          <div className="mb-4">
            <p className={`text-xs font-semibold uppercase tracking-wider px-3 mb-1 ${
              isDark ? "text-gray-500" : "text-gray-400"
            }`}>
              Appearance
            </p>
            <button
              onClick={toggleThemeDialog}
              className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
                isDark ? "bg-white/[0.03] hover:bg-white/5" : "bg-gray-50 hover:bg-gray-100"
              }`}
            >
              <div className={`p-2 rounded-xl ${
                isDark ? "bg-chatriv-purple/15 text-chatriv-purple-muted" : "bg-chatriv-purple-light text-chatriv-purple"
              }`}>
                {isDark ? <HiOutlineMoon className="h-5 w-5" /> : <HiOutlineSun className="h-5 w-5" />}
              </div>
              <div className="flex-1 text-left">
                <p className={`text-sm font-medium ${isDark ? "text-white" : "text-gray-900"}`}>Theme</p>
                <p className={`text-xs ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                  {theme.charAt(0).toUpperCase() + theme.slice(1)} mode
                </p>
              </div>
              <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                isDark ? "bg-chatriv-purple/20 text-chatriv-purple-muted" : "bg-chatriv-purple-light text-chatriv-purple"
              }`}>
                {theme === 'dark' ? 'Dark' : 'Light'}
              </span>
            </button>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`w-full flex items-center gap-3 p-3 rounded-xl transition-colors ${
              isDark
                ? "text-red-400 hover:bg-red-500/10"
                : "text-red-500 hover:bg-red-50"
            }`}
          >
            <div className={`p-2 rounded-xl ${
              isDark ? "bg-red-500/10" : "bg-red-50"
            }`}>
              <FaSignOutAlt className="h-4 w-4" />
            </div>
            <span className="text-sm font-medium">Log out</span>
          </button>
        </div>
      </div>
    </Layout>
  )
}
