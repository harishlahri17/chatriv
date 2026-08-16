import React, { useEffect, useState } from 'react'
import useLayoutStore from '../store/layoutStore';
import useThemeStore from '../store/themeStore';
import Sidebar from './Sidebar'
import { AnimatePresence, motion } from 'framer-motion';
import ChatWindow from '../pages/chatSection/ChatWindow'

export default function Layout({ children, isThemeDialogeOpen, toggleThemeDialoge, isStatusPreviewOpen, statusPreviewContent }) {

  const selectedContact = useLayoutStore((state) => state.selectedContact);
  const setSelectedContact = useLayoutStore((state) => state.setSelectedContact);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  const { theme, setTheme } = useThemeStore();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <div className={`min-h-screen flex relative ${
      isDark ? "bg-surface-chat-dark text-white" : "bg-gray-50 text-gray-900"
    }`}>
      {!isMobile && <Sidebar />}
      <div className={`flex-1 flex overflow-hidden ${isMobile ? "flex-col" : ""}`}>

        <AnimatePresence initial={false}>
          {(!selectedContact || !isMobile) && (
            <motion.div
              key="chatlist"
              initial={{ x: isMobile ? "-100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "tween" }}
              className={`${isMobile ? "w-full pb-16" : "w-[380px] flex-shrink-0"} h-screen`}
            >
              {children}
            </motion.div>
          )}
          {(selectedContact || !isMobile) && (
            <motion.div
              key="chatWindow"
              initial={{ x: isMobile ? "100%" : 0 }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween" }}
              className="flex-1 h-screen min-w-0"
            >
              <ChatWindow
                selectedContact={selectedContact}
                setSelectedContact={setSelectedContact}
                isMobile={isMobile}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      {isMobile && <Sidebar />}

      {isThemeDialogeOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50 backdrop-blur-sm">
          <div className={`p-6 rounded-2xl shadow-card max-w-sm w-full mx-4 ${
            isDark ? "bg-[#1A1D23] text-white" : "bg-white text-gray-900"
          }`}>
            <h2 className="text-xl font-semibold mb-5">Choose a theme</h2>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
                <input
                  type="radio"
                  value="light"
                  checked={theme === 'light'}
                  onChange={() => setTheme("light")}
                  className="form-radio text-chatriv-purple accent-chatriv-purple"
                />
                <span className="font-medium">Light</span>
              </label>
              <label className="flex items-center space-x-3 cursor-pointer p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5">
                <input
                  type="radio"
                  value="dark"
                  checked={theme === 'dark'}
                  onChange={() => setTheme("dark")}
                  className="form-radio text-chatriv-purple accent-chatriv-purple"
                />
                <span className="font-medium">Dark</span>
              </label>
            </div>
            <button
              onClick={toggleThemeDialoge}
              className="mt-6 w-full bg-chatriv-purple text-white py-2.5 rounded-xl hover:bg-chatriv-purple-dark transition duration-200 font-medium"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {isStatusPreviewOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          {statusPreviewContent}
        </div>
      )}
    </div>
  )
}
