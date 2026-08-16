import React, { useState } from 'react'
import useLayoutStore from '../../store/layoutStore';
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import { useChatStore } from '../../store/chatStore';
import { FaPlus, FaSearch } from 'react-icons/fa';
import { motion } from 'framer-motion'
import formatimestamp from '../../utils/formatTime'

const filters = ['All', 'Unread', 'Groups'];

export default function ChatList({ contacts }) {
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const isUserOnline = useChatStore((state) => state.isUserOnline);
  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const [searchTerms, setSearchTerm] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const isDark = theme === 'dark';

  const filteredContact = contacts?.filter((contact) => {
    const matchesSearch = contact?.username?.toLowerCase().includes(searchTerms.toLowerCase());
    if (!matchesSearch) return false;
    if (activeFilter === 'Unread') {
      return contact?.conversation?.unreadCount > 0 &&
        contact?.conversation?.lastMessage?.receiver === user?._id;
    }
    return true;
  });

  return (
    <div className={`w-full h-screen flex flex-col border-r ${isDark ? "bg-surface-list-dark border-gray-800" : "bg-surface-list-light border-gray-200"
      }`}>
      {/* Header */}
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FaSearch className={`absolute left-3.5 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 ${isDark ? "text-gray-500" : "text-gray-400"
              }`} />
            <input
              type="text"
              placeholder="Search or start new chat..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 transition-shadow ${isDark
                  ? "bg-surface-input-dark text-white placeholder-gray-500 border border-gray-800"
                  : "bg-surface-input-light text-gray-900 placeholder-gray-400 border border-gray-200"
                }`}
              value={searchTerms}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button className="p-2.5 bg-chatriv-purple text-white rounded-xl hover:bg-chatriv-purple-dark transition-colors shadow-soft flex-shrink-0">
            <FaPlus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 pb-3 flex gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${activeFilter === filter
                ? "bg-chatriv-purple text-white shadow-soft"
                : isDark
                  ? "bg-white/5 text-gray-400 hover:bg-white/10"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Chat list */}
      <div className="overflow-y-auto flex-1 scrollbar-thin">
        {filteredContact?.map((contact) => {
          const isSelected = selectedContact?._id === contact?._id;
          const hasUnread = contact?.conversation?.unreadCount > 0 &&
            contact?.conversation?.lastMessage?.receiver === user?._id;

          return (
            <motion.div
              key={contact?._id}
              onClick={() => setSelectedContact(contact)}
              className={`px-4 py-3 flex items-center cursor-pointer transition-colors ${isSelected
                  ? isDark
                    ? "bg-chatriv-purple/15 border-l-2 border-chatriv-purple"
                    : "bg-chatriv-purple-light border-l-2 border-chatriv-purple"
                  : isDark
                    ? "hover:bg-white/5 border-l-2 border-transparent"
                    : "hover:bg-gray-50 border-l-2 border-transparent"
                }`}
            >
              <div className="relative flex-shrink-0">
                <img
                  src={contact?.profilePicture}
                  alt={contact?.username}
                  className="w-12 h-12 rounded-full object-cover"
                />
                <span
                  className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 ${isUserOnline(contact?._id)
                    ? 'bg-green-500'
                    : 'bg-red-500'
                    } ${isDark
                      ? 'border-[#121418]'
                      : 'border-white'
                    }`}
                />
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between items-baseline">
                  <h2 className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-900"
                    }`}>
                    {contact?.username}
                  </h2>
                  {contact?.conversation && (
                    <span className={`text-xs flex-shrink-0 ml-2 ${hasUnread ? "text-chatriv-purple font-medium" : isDark ? "text-gray-500" : "text-gray-400"
                      }`}>
                      {formatimestamp(contact?.conversation?.lastMessage?.createdAt)}
                    </span>
                  )}
                </div>
                <div className="flex justify-between items-center mt-0.5">
                  <p className={`text-sm truncate ${isDark ? "text-gray-400" : "text-gray-500"
                    }`}>
                    {contact?.conversation?.lastMessage?.content || "Start a conversation"}
                  </p>
                  {hasUnread && (
                    <span className="ml-2 flex-shrink-0 w-5 h-5 flex items-center justify-center bg-chatriv-purple text-white text-xs font-semibold rounded-full">
                      {contact.conversation.unreadCount}
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  )
}
