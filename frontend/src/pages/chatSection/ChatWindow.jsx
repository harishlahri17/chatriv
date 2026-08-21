import React, { useEffect, useRef, useState } from 'react'
import useUserStore from '../../store/useUserStore';
import useThemeStore from '../../store/themeStore'
import { useChatStore } from '../../store/chatStore';
import { isToday, isYesterday, format } from 'date-fns'
import {
  FaArrowLeft, FaEllipsisV, FaFile, FaImage, FaLock,
  FaPaperclip, FaPaperPlane, FaSmile, FaTimes, FaVideo,
  FaCamera, FaMicrophone, FaTrash, FaPause, FaPlay, 
} from 'react-icons/fa';
import MessageBubble from './MessageBubble';
import EmojiPicker from 'emoji-picker-react'
import VideoCallManager from '../videoCall/VideoCallManager';
import { getSocket } from '../../services/chat.service';
import useVideoCallStore from '../../store/videoCallStore';
import useOutsideClick from '../../hooks/useOutsideClick';

const isValidate = (date) => date instanceof Date && !isNaN(date);

export default function ChatWindow({ selectedContact, setSelectedContact, isMobile }) {
  const [message, setMessage] = useState("");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showFileMenu, setShowFileMenu] = useState(false);
  const [filePreview, setFilePreview] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);

  // Voice note state & preview
  const [isRecording, setIsRecording] = useState(false);
  const [isRecordingPaused, setIsRecordingPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState(null);
  const [audioPreviewUrl, setAudioPreviewUrl] = useState(null);
  const [isPreviewPlaying, setIsPreviewPlaying] = useState(false);
  const [previewTime, setPreviewTime] = useState(0);
  const [previewDuration, setPreviewDuration] = useState(0);

  const typingTimeoutRef = useRef(null);
  const messageEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);
  const fileMenuRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const recordingTimerRef = useRef(null);
  const previewAudioRef = useRef(null);

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

  useEffect(() => {
    return () => {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        const stream = mediaRecorderRef.current.stream;
        if (stream) stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      setShowFileMenu(false);
      if (file.type.startsWith('image/') || file.type.startsWith("video/"))
        setFilePreview(URL.createObjectURL(file))
    }
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioPreviewUrl(url);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start(100);
      setIsRecording(true);
      setIsRecordingPaused(false);
      setRecordingTime(0);
      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      setIsPreviewPlaying(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Failed to access microphone", err);
      alert("Could not access microphone. Please allow microphone permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording && !isRecordingPaused) {
      if (mediaRecorderRef.current.state === 'recording') {
        try {
          mediaRecorderRef.current.requestData();
        } catch (e) {
          console.warn("requestData failed", e);
        }
        mediaRecorderRef.current.pause();
      }
      setIsRecordingPaused(true);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);

      if (audioChunksRef.current.length > 0) {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        if (audioPreviewUrl) URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(URL.createObjectURL(blob));
      }
    }
  };

  const resumeRecording = () => {
    if (mediaRecorderRef.current && isRecording && isRecordingPaused) {
      if (mediaRecorderRef.current.state === 'paused') {
        mediaRecorderRef.current.resume();
      }
      setIsRecordingPaused(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    }
  };

  const stopAndGetBlob = () => {
    return new Promise((resolve) => {
      if (!mediaRecorderRef.current || !isRecording) {
        resolve(audioBlob);
        return;
      }
      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const stream = mediaRecorderRef.current.stream;
        if (stream) stream.getTracks().forEach(track => track.stop());
        resolve(blob);
      };
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsRecordingPaused(false);
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    });
  };

  const cancelRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.onstop = () => {
        const stream = mediaRecorderRef.current.stream;
        if (stream) stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorderRef.current.stop();
    }
    setIsRecording(false);
    setIsRecordingPaused(false);
    setRecordingTime(0);
    setAudioBlob(null);
    if (audioPreviewUrl) {
      URL.revokeObjectURL(audioPreviewUrl);
      setAudioPreviewUrl(null);
    }
    setIsPreviewPlaying(false);
    setPreviewTime(0);
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
  };

  const togglePreviewPlay = () => {
    if (!previewAudioRef.current) return;
    if (isPreviewPlaying) {
      previewAudioRef.current.pause();
      setIsPreviewPlaying(false);
    } else {
      previewAudioRef.current.play();
      setIsPreviewPlaying(true);
    }
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleSendMessage = async () => {
    if (!selectedContact) return;
    try {
      let voiceBlob = audioBlob;
      if (isRecording) {
        voiceBlob = await stopAndGetBlob();
      }

      const formData = new FormData();
      formData.append("senderId", user?._id);
      formData.append("receiverId", selectedContact?._id);
      formData.append("messageStatus", online ? "delivered" : "send");

      if (message.trim()) formData.append("content", message.trim());
      if (voiceBlob) {
        formData.append("media", voiceBlob, "voicenote.webm");
      } else if (selectedFile) {
        formData.append("media", selectedFile, selectedFile.name);
      }

      if (!message.trim() && !selectedFile && !voiceBlob) return;

      await sendMessage(formData);
      setMessage("");
      setFilePreview(null);
      setSelectedFile(null);
      setShowFileMenu(false);
      setAudioBlob(null);
      if (audioPreviewUrl) {
        URL.revokeObjectURL(audioPreviewUrl);
        setAudioPreviewUrl(null);
      }
      setIsPreviewPlaying(false);
      setRecordingTime(0);
      setPreviewTime(0);
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

  // Close emoji picker when clicking outside
  useOutsideClick(emojiPickerRef, () => {
    if (showEmojiPicker) {
      setShowEmojiPicker(false);
    }
  });
  // Close file attachment menu when clicking outside
  useOutsideClick(fileMenuRef, () => {
    if (showFileMenu) {
      setShowFileMenu(false);
    }
  });

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
            {isRecording && !isRecordingPaused ? (
              /* Active Recording Bar */
              <div className="flex-1 flex items-center justify-between px-2 py-0.5 min-w-0">
                <div className="flex items-center gap-2">
                  {/* Discard trash button */}
                  <button
                    type="button"
                    onClick={cancelRecording}
                    title="Discard recording"
                    className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/15 rounded-full transition-all active:scale-95"
                  >
                    <FaTrash className="h-4 w-4" />
                  </button>

                  {/* Recording timer badge */}
                  <div className="flex items-center gap-2 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
                    <span className="text-xs font-mono font-bold text-red-500 tracking-wider">
                      {formatRecordingTime(recordingTime)}
                    </span>
                  </div>
                </div>

                {/* Animated sound wave bars while recording */}
                <div className="flex items-center gap-1 h-5 px-2">
                  <span className="w-1 bg-chatriv-purple rounded-full h-3 animate-pulse" />
                  <span className="w-1 bg-chatriv-purple rounded-full h-5 animate-pulse [animation-delay:150ms]" />
                  <span className="w-1 bg-chatriv-purple rounded-full h-2 animate-pulse [animation-delay:300ms]" />
                  <span className="w-1 bg-chatriv-purple rounded-full h-4 animate-pulse [animation-delay:450ms]" />
                  <span className="w-1 bg-chatriv-purple rounded-full h-3 animate-pulse [animation-delay:200ms]" />
                  <span className="w-1 bg-chatriv-purple rounded-full h-5 animate-pulse [animation-delay:350ms]" />
                </div>

                {/* Pause Button */}
                <button
                  type="button"
                  onClick={pauseRecording}
                  title="Pause recording"
                  className={`p-2.5 rounded-full transition-all active:scale-95 ${
                    isDark ? "bg-white/10 text-white hover:bg-white/20" : "bg-gray-200 text-gray-800 hover:bg-gray-300"
                  }`}
                >
                  <FaPause className="h-4 w-4" />
                </button>
              </div>
            ) : audioPreviewUrl || audioBlob || isRecordingPaused ? (
              /* Modern Pre-play Voice Note Preview Bar */
              <div className="flex-1 flex items-center gap-3 px-2 py-0.5 min-w-0">
                <audio
                  ref={previewAudioRef}
                  src={audioPreviewUrl}
                  onTimeUpdate={() => {
                    if (previewAudioRef.current) setPreviewTime(previewAudioRef.current.currentTime);
                  }}
                  onLoadedMetadata={() => {
                    if (previewAudioRef.current) {
                      const d = previewAudioRef.current.duration;
                      if (isFinite(d) && d > 0) setPreviewDuration(d);
                    }
                  }}
                  onEnded={() => {
                    setIsPreviewPlaying(false);
                    setPreviewTime(0);
                  }}
                />

                {/* Discard Trash Button */}
                <button
                  type="button"
                  onClick={cancelRecording}
                  title="Discard recording"
                  className="p-2 text-red-500 hover:text-red-600 hover:bg-red-500/15 rounded-full transition-all active:scale-95 flex-shrink-0"
                >
                  <FaTrash className="h-4 w-4" />
                </button>

                {/* Play / Pause Preview Button */}
                <button
                  type="button"
                  onClick={togglePreviewPlay}
                  title={isPreviewPlaying ? "Pause preview" : "Play preview"}
                  className="w-9 h-9 rounded-full bg-chatriv-purple hover:bg-chatriv-purple-dark text-white flex items-center justify-center transition-all duration-200 shadow-purple active:scale-95 flex-shrink-0"
                >
                  {isPreviewPlaying ? <FaPause size={13} /> : <FaPlay size={13} className="ml-0.5" />}
                </button>

                {/* Preview Waveform & Info */}
                <div className="flex-1 flex flex-col gap-1 min-w-0">
                  <div className="flex items-center justify-between text-[11px] font-medium leading-none">
                    <span className={`truncate ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                      {isRecordingPaused ? "Voice Note Paused" : "Voice Note Preview"}
                    </span>
                    <span className="font-mono text-[10px] opacity-75">
                      {formatRecordingTime(Math.floor(isPreviewPlaying ? previewTime : (previewDuration || recordingTime)))}
                    </span>
                  </div>

                  {/* Interactive Preview Waveform Bars */}
                  <div
                    onClick={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      const clickX = e.clientX - rect.left;
                      const percentage = Math.max(0, Math.min(1, clickX / rect.width));
                      const validDur = isFinite(previewDuration) && previewDuration > 0 ? previewDuration : (recordingTime || 0);
                      if (previewAudioRef.current && validDur > 0) {
                        const newTime = percentage * validDur;
                        previewAudioRef.current.currentTime = newTime;
                        setPreviewTime(newTime);
                      }
                    }}
                    className="relative flex items-center justify-between gap-[2px] h-6 cursor-pointer py-0.5 group/wave w-full"
                    title="Click to seek preview"
                  >
                    {[
                      30, 55, 80, 45, 95, 60, 85, 35, 70, 50,
                      90, 40, 100, 65, 80, 45, 85, 55, 90, 65,
                      40, 75, 45, 30
                    ].map((heightPercent, idx, arr) => {
                      const validDur = isFinite(previewDuration) && previewDuration > 0 ? previewDuration : (recordingTime || 0);
                      const progressPct = validDur ? Math.max(0, Math.min(100, (previewTime / validDur) * 100)) : 0;
                      const barPercent = (idx / (arr.length - 1)) * 100;
                      const isPlayed = barPercent <= progressPct;

                      return (
                        <span
                          key={idx}
                          style={{ height: `${heightPercent}%` }}
                          className={`w-[2.5px] rounded-full transition-colors duration-75 ${
                            isPlayed
                              ? "bg-chatriv-purple"
                              : isDark ? "bg-gray-600/70" : "bg-gray-300"
                          }`}
                        />
                      );
                    })}
                  </div>
                </div>

                {/* Resume Button if recording is currently paused */}
                {isRecording && isRecordingPaused && (
                  <button
                    type="button"
                    onClick={resumeRecording}
                    title="Resume recording"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-chatriv-purple/15 text-chatriv-purple hover:bg-chatriv-purple/25 rounded-full font-semibold text-xs transition-all active:scale-95 flex-shrink-0 shadow-sm"
                  >
                    <FaMicrophone size={12} />
                    <span>Resume</span>
                  </button>
                )}
              </div>
            ) : (
              <>
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
                <div ref={fileMenuRef} className="relative flex items-center gap-0.5">
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
              </>
            )}

            {/* Main action button: Send Icon if input filled or recording/audioBlob present, else Voice Note (Microphone) Icon */}
            {message.trim() || selectedFile || isRecording || audioBlob ? (
              <button
                onClick={handleSendMessage}
                title="Send"
                className="flex-shrink-0 p-2.5 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white rounded-full transition-all duration-150 shadow-purple focus:outline-none active:scale-95"
              >
                <FaPaperPlane className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={startRecording}
                title="Record Voice Note"
                className="flex-shrink-0 p-2.5 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white rounded-full transition-all duration-150 shadow-purple focus:outline-none active:scale-95"
              >
                <FaMicrophone className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <VideoCallManager socket={socket} />
    </>
  )
}
