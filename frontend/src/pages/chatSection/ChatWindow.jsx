import React, { useEffect, useRef, useState } from 'react'
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore'
import { useChatStore } from '../../store/chatStore';
import { isToday, isYesterday, format } from 'date-fns'
import {
  FaArrowLeft, FaEllipsisV, FaFile, FaImage, FaLock,
  FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo,
  FaCamera, FaMicrophone
} from 'react-icons/fa';
import MessageBubble from './MessageBubble';
import EmojiPicker from 'emoji-picker-react'
import VideoCallManager from '../videoCall/VideoCallManager';
import { getSocket } from '../../services/chat.service';
import useVideoCallStore from '../../store/videoCallStore';

const isValidate = (date) => date instanceof Date && !isNaN(date);

export default function ChatWindow({ selectedContact, setSelectedContact, isMobile }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const socket = getSocket();
  const isDark = theme === 'dark';

  const { messages, sendMessage, fetchMessages,
    fetchConversations, conversations, isUserTyping, startTyping,
    stopTyping, getUserLastSeen, isUserOnline, deleteMessage,
    addReaction } = useChatStore();

  const online = isUserOnline(selectedContact?._id);
  const lastSeen = getUserLastSeen(selectedContact?._id);
  const isTyping = isUserTyping(selectedContact?._id);

  useEffect(() => {
    if (selectedContact?._id && conversations?.data?.length > 0) {
      const conversation = conversations?.data?.find((conv) =>
        conv.participants.some((p) => p._id === selectedContact?._id))
      if (conversation?._id) fetchMessages(conversation._id)
    }
  }, [selectedContact, conversations, fetchMessages]);

  useEffect(() => { fetchConversations(); }, [fetchConversations]);
  useEffect(() => { messageEndRef.current?.scrollIntoView({ behavior: "auto" }) }, [messages]);

  useEffect(() => {
    if (message && selectedContact) {
      startTyping(selectedContact?._id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
      typingTimeoutRef.current = setTimeout(() => stopTyping(selectedContact?._id), 2000);
    }
    return () => { if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current) }
  }, [message, selectedContact, startTyping, stopTyping]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith('image/') || file.type.startsWith("video/"))
        setFilePreview(URL.createObjectURL(file))
    }
  }

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    try {
      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");
      if (message.trim()) formData.append("content", message.trim());
      if (selectedFile) formData.append("media", selectedFile, selectedFile.name)
      if (!message.trim() && !selectedFile) return;
      await sendMessage(formData);
      setMessage(""); setFilePreview(null); setSelectedFile(null); setShowFileMenu(null);
    } catch (error) { console.error("Failed to send message", error); }
  }

  const renderDateSeparator = (date) => {
    if (!isValidate(date)) return null;
    const dateString = isToday(date) ? "Today" : isYesterday(date) ? "Yesterday" : format(date, "EEEE, MMMM d");
    return (
      <div className="flex justify-center my-4">
        <span className={`px-4 py-1 rounded-full text-xs font-medium tracking-wide ${isDark ? "bg-white/8 text-gray-400 border border-white/5" : "bg-white text-gray-400 border border-gray-200 shadow-sm"
          }`}>{dateString}</span>
      </div>
    )
  }

  const groupedMessages = Array.isArray(messages) ? messages.reduce((acc, msg) => {
    if (!msg.createdAt) return acc;
    const date = new Date(msg.createdAt);
    if (isValidate(date)) {
      const key = format(date, "yyyy-MM-dd");
      if (!acc[key]) acc[key] = [];
      acc[key].push(msg);
    }
    return acc;
  }, {}) : {};

  const handleReaction = (messageId, emoji) => addReaction(messageId, emoji);
  const handleVideoCall = () => {
    if (selectedContact && online) {
      const { initiateCall } = useVideoCallStore.getState();
      initiateCall(selectedContact?._id, selectedContact?.username, selectedContact?.profilePicture, "video")
    } else { alert("User is offline") }
  }

  /* ── Empty state ── */
  if (!selectedContact) {
    return (
      <div className={`flex-1 flex flex-col items-center justify-center h-screen ${isDark ? "chat-bg-dark" : "chat-bg-light"
        }`}>
        <div className="max-w-sm text-center px-6 fade-in">
          <div className="w-20 h-20 rounded-3xl bg-chatriv-purple/10 flex items-center justify-center mx-auto mb-6 shadow-purple">
            <FaPaperPlane className="h-9 w-9 text-chatriv-purple" />
          </div>
          <h2 className={`text-2xl font-bold mb-3 ${isDark ? "text-white" : "text-gray-900"}`}>
            Welcome to Chatriv
          </h2>
          <p className={`text-sm mb-6 leading-relaxed ${isDark ? "text-gray-400" : "text-gray-500"}`}>
            Select a conversation from the sidebar to start messaging your contacts.
          </p>
          <p className={`text-xs flex items-center justify-center gap-1.5 ${isDark ? "text-gray-600" : "text-gray-400"}`}>
            <FaLock className="h-3 w-3" /> End-to-end encrypted
          </p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className={`flex-1 h-screen w-full flex flex-col ${isDark ? "bg-[#0D0F12]" : "bg-[#F0F2F5]"}`}>

        {/* ── Header ── */}
        <div className={`px-4 py-3 flex items-center gap-3 border-b flex-shrink-0 ${isDark ? "bg-[#181B22] border-gray-800/70" : "bg-white border-gray-200"
          }`}>
          {/* Back arrow — always visible */}
          <button
            onClick={() => setSelectedContact(null)}
            className={`flex-shrink-0 p-2 rounded-xl transition-all duration-150 focus:outline-none ${isDark ? "hover:bg-white/8 text-gray-300" : "hover:bg-gray-100 text-gray-600"
              }`}
            title="Back"
          >
            <FaArrowLeft className="h-4 w-4" />
          </button>

          {/* Profile with ring + gap */}
          <div className="relative flex-shrink-0">
            <div className={`p-0.5 rounded-full ${online
              ? `ring-2 ring-green-500 ring-offset-2 ${isDark ? "ring-offset-[#181B22]" : "ring-offset-white"}`
              : `ring-2 ${isDark ? "ring-gray-700 ring-offset-[#181B22]" : "ring-gray-200 ring-offset-white"} ring-offset-2`
              }`}>
              <img
                src={selectedContact?.profilePicture}
                alt={selectedContact?.username}
                className="w-9 h-9 rounded-full object-cover block"
              />
            </div>
          </div>

          {/* Name + status */}
          <div className="flex-grow min-w-0">
            <h2 className={`font-semibold text-sm truncate ${isDark ? "text-white" : "text-gray-900"}`}>
              {selectedContact?.username}
            </h2>
            {isTyping ? (
              <div className="flex items-center gap-1 mt-0.5">
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="typing-dot" />
                <span className="text-xs text-chatriv-purple-muted font-medium ml-1">typing</span>
              </div>
            ) : (
              <p className={`text-xs ${online ? "text-green-500" : isDark ? "text-gray-500" : "text-gray-400"}`}>
                {online ? "Online" : lastSeen ? `Last seen ${format(new Date(lastSeen), "HH:mm")}` : "Offline"}
              </p>
            )}
          </div>

          {/* Action icons */}
          <div className="flex items-center gap-0.5">
            {/* <button className={`p-2.5 rounded-xl transition-all duration-150 focus:outline-none 
              ${isDark
                ? "text-gray-400 hover:bg-white/8 hover:text-gray-200"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}>
              <FaSearch className="h-4 w-4" />
            </button>

            <button className={`p-2.5 rounded-xl transition-all duration-150 focus:outline-none 
              ${isDark
                ? "text-gray-400 hover:bg-white/8 hover:text-gray-200"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}>
              <FaPhoneAlt className="h-4 w-4" />
            </button> */}

            <button
              onClick={handleVideoCall}
              title={online ? "Video call" : "User offline"}
              className={`p-2.5 rounded-xl transition-all duration-150 focus:outline-none 
                ${isDark
                  ? "text-gray-400 hover:bg-white/8 hover:text-gray-200"
                  : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
                }`}
            >
              <FaVideo className="h-4 w-4" />
            </button>

            <button className={`p-2.5 rounded-xl transition-all duration-150 focus:outline-none 
              ${isDark
                ? "text-gray-400 hover:bg-white/8 hover:text-gray-200"
                : "text-gray-500 hover:bg-gray-100 hover:text-gray-700"
              }`}>
              <FaEllipsisV className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Messages ── */}
        <div className={`flex-1 px-4 py-3 overflow-y-auto scrollbar-thin ${isDark ? "chat-bg-dark" : "chat-bg-light"
          }`}>
          {Object.entries(groupedMessages).map(([date, msgs]) => (
            <React.Fragment key={date}>
              {renderDateSeparator(new Date(date))}
              {msgs.filter(msg => msg.conversation === selectedContact?.conversation?._id)
                .map(msg => (
                  <MessageBubble
                    key={msg._id || msg.tempId}
                    message={msg}
                    theme={theme}
                    currentUser={user}
                    onReact={handleReaction}
                    deleteMessage={deleteMessage}
                  />
                ))}
            </React.Fragment>
          ))}

          {isTyping && (
            <div className="chat chat-start mb-2">
              <div className={`chat-bubble text-sm ${isDark ? "bg-[#252B36] text-gray-300" : "bg-white text-gray-600 shadow-soft"
                }`}>
                <span className="inline-flex items-center gap-1.5">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </span>
              </div>
            </div>
          )}
          <div ref={messageEndRef} />
        </div>

        {/* ── Modern typing indicator ── */}
        {isTyping && (
          <div className="chat chat-start mb-3">
            <div
              className={`
                inline-flex items-center gap-2
                px-4 py-2.5
                rounded-[18px]
                text-[13px]
                font-medium
                shadow-[0_4px_14px_rgba(0,0,0,0.06)]
                ${isDark
                  ? "bg-[#252B36] text-gray-300 border border-gray-700/40"
                  : "bg-white text-[#6B7280] border border-gray-100"
                }
             `}
            >
              <div className="flex items-center gap-[4px]">
                <span
                  className="w-[7px] h-[7px] rounded-full bg-emerald-500 animate-bounce"
                />
                <span
                  className="w-[7px] h-[7px] rounded-full bg-emerald-500 animate-bounce [animation-delay:150ms]"
                />
                <span
                  className="w-[7px] h-[7px] rounded-full bg-emerald-500 animate-bounce [animation-delay:300ms]"
                />
              </div>

              <span>
                {selectedContact?.username} is typing...
              </span>
            </div>
          </div>
        )}

        {/* ── File preview ── */}
        {filePreview && (
          <div className={`relative p-3 border-t flex-shrink-0 ${isDark ? "border-gray-800/70 bg-[#181B22]" : "border-gray-200 bg-white"
            }`}>
            {selectedFile?.type.startsWith("video/") ? (
              <video src={filePreview} controls className="w-56 rounded-2xl shadow-card mx-auto" />
            ) : (
              <img src={filePreview} alt="preview" className="w-56 rounded-2xl shadow-card mx-auto object-cover" />
            )}
            <button
              onClick={() => { setSelectedFile(null); setFilePreview(null) }}
              className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-1.5 transition-colors"
            >
              <FaTimes className="h-3 w-3" />
            </button>
          </div>
        )}

        {/* ── Input bar ── */}
        <div className={`px-4 py-3 border-t relative flex-shrink-0 ${isDark ? "bg-[#181B22] border-gray-800/70" : "bg-white border-gray-200"
          }`}>

          {/* Emoji picker — anchored above input */}
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="absolute left-4 bottom-full mb-2 z-50 slide-up">
              <EmojiPicker
                onEmojiClick={(obj) => { setMessage(p => p + obj.emoji); setShowEmojiPicker(false) }}
                theme={theme}
              />
            </div>
          )}

          <div className={`flex items-center gap-2 px-3 py-2 rounded-2xl ${isDark ? "bg-[#1E222B]" : "bg-[#F0F2F5]"
            }`}>
            {/* Emoji button */}
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className={`flex-shrink-0 p-1.5 rounded-xl transition-all duration-150 focus:outline-none ${isDark ? "text-gray-400 hover:text-yellow-400 hover:bg-white/8" : "text-gray-500 hover:text-yellow-500 hover:bg-gray-200"
                }`}
            >
              <FaSmile className="h-5 w-5" />
            </button>

            {/* Text input */}
            <input
              type="text"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyPress={(e) => { if (e.key === "Enter") handleSendMessage() }}
              placeholder="Type a message…"
              className={`flex-1 bg-transparent text-sm focus:outline-none ${isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                }`}
            />

            {/* Attachment buttons */}
            <div className="relative flex items-center gap-0.5">
              <button
                onClick={() => setShowFileMenu(!showFileMenu)}
                className={`flex-shrink-0 p-1.5 rounded-xl transition-all duration-150 focus:outline-none ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/8" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                  }`}
              >
                <FaPaperclip className="h-4 w-4" />
              </button>
              <button className={`flex-shrink-0 p-1.5 rounded-xl transition-all duration-150 focus:outline-none ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/8" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}>
                <FaCamera className="h-4 w-4" />
              </button>
              <button className={`flex-shrink-0 p-1.5 rounded-xl transition-all duration-150 focus:outline-none ${isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/8" : "text-gray-500 hover:text-gray-700 hover:bg-gray-200"
                }`}>
                <FaMicrophone className="h-4 w-4" />
              </button>

              {/* File menu popup */}
              {showFileMenu && (
                <div className={`absolute bottom-full right-0 mb-2 rounded-2xl shadow-card overflow-hidden slide-up ${isDark ? "bg-[#1E222B] border border-gray-700/60" : "bg-white border border-gray-100"
                  }`}>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*,video/*" className="hidden" />
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className={`flex items-center gap-3 px-5 py-3 w-full text-sm transition-colors ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-50 text-gray-700"
                      }`}
                  >
                    <FaImage className="h-4 w-4 text-chatriv-purple" /> Image / Video
                  </button>
                  <button
                    onClick={() => fileInputRef.current.click()}
                    className={`flex items-center gap-3 px-5 py-3 w-full text-sm transition-colors border-t ${isDark ? "hover:bg-white/5 text-gray-200 border-gray-700/60" : "hover:bg-gray-50 text-gray-700 border-gray-100"
                      }`}
                  >
                    <FaFile className="h-4 w-4 text-chatriv-purple" /> Document
                  </button>
                </div>
              )}
            </div>

            {/* Send button */}
            <button
              onClick={handleSendMessage}
              className="flex-shrink-0 p-2.5 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white rounded-full transition-all duration-150 shadow-purple focus:outline-none active:scale-95"
            >
              <FaPaperPlane className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <VideoCallManager socket={socket} />
    </>
  )
}
