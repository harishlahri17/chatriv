import React, { useEffect, useState } from 'react'
import useThemeStore from '../../store/themeStore';
import useUserStore from '../../store/useUserStore';
import useStatusStore from '../../store/useStatusStore';
import Layout from '../../components/Layout';
import StatusPreview from './StatusPreview';
import { motion } from 'framer-motion'
import { RxCross2 } from 'react-icons/rx';
import { FaCamera, FaEllipsisH, FaPlus, FaSmile } from 'react-icons/fa';
import { HiOutlineSignal } from 'react-icons/hi2';
import formatTimestamp from '../../utils/formatTime';
import StatusList from './StatusList';
import EmojiPicker from 'emoji-picker-react';

export default function Status() {
  const [previewContact, setPreviewContact] = useState(null)
  const [currentStatusIndex, setCurrentStatusIndex] = useState(0);
  const [showOption, setShowOption] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [showCreatedModal, setShowcreateModal] = useState(false)
  const [newStatus, setNewStatus] = useState("")
  const [filePreview, setFilePreview] = useState(null)
  const [showStatusEmoji, setShowStatusEmoji] = useState(false)

  const { theme } = useThemeStore();
  const { user } = useUserStore();
  const isDark = theme === 'dark';

  const { statuses, loading, error, fetchStatuses, createStatus, viewStatus,
    deleteStatus, getUserStatuses, getOtherStatuses, clearError,
    initializeSocket, cleanupSocket } = useStatusStore();

  const userStatuses = getUserStatuses(user?._id);
  const otherStatuses = getOtherStatuses(user?._id);

  useEffect(() => {
    fetchStatuses();
    initializeSocket();
    return () => cleanupSocket();
  }, [user?._id, fetchStatuses, initializeSocket, cleanupSocket]);

  useEffect(() => () => clearError(), [clearError]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedFile(file);
      if (file.type.startsWith('image/') || file.type.startsWith("video/")) {
        setFilePreview(URL.createObjectURL(file))
      }
    }
  }

  const handleCreateStatus = async () => {
    if (!newStatus.trim() && !selectedFile) return;
    try {
      await createStatus({ content: newStatus, file: selectedFile });
      setNewStatus("")
      setSelectedFile(null)
      setFilePreview(null)
      setShowcreateModal(false)
    } catch (error) {
      console.error("Error on creating status", error);
    }
  }

  const handleViewStatus = async (statusId) => {
    try { await viewStatus(statusId); }
    catch (error) { console.error("Error to view status", error); }
  }

  const handleDeleteStatus = async (statusId) => {
    try {
      await deleteStatus(statusId);
      setShowOption(false);
      handlePreviewClose();
    } catch (error) {
      console.error("Error to delete status", error);
    }
  }

  const handlePreviewClose = () => {
    setPreviewContact(null);
    setCurrentStatusIndex(0);
  }

  const handlePreviewNext = () => {
    if (
      currentStatusIndex <
      previewContact.statuses.length - 1
    ) {
      const nextIndex = currentStatusIndex + 1;
      setCurrentStatusIndex(nextIndex);
      const nextStatus =
        previewContact.statuses[nextIndex];

      if (
        nextStatus &&
        previewContact.id !== user?._id
      ) {
        handleViewStatus(nextStatus.id);
      }

    } else {
      handlePreviewClose();
    }
  };

  const handlePreviewPrev = () => {
    setCurrentStatusIndex((prev) => Math.max(prev - 1, 0))
  }

  const handleStatusPreview = (contact, statusIndex = 0) => {
    setPreviewContact(contact);
    setCurrentStatusIndex(statusIndex);
    const selectedStatus = contact.statuses[statusIndex];
    if (
      selectedStatus &&
      contact.id !== user?._id
    ) {
      handleViewStatus(selectedStatus.id);
    }
  };

  return (
    <Layout
      isStatusPreviewOpen={!!previewContact}
      statusPreviewContent={
        previewContact && (
          <StatusPreview
            contact={previewContact}
            currentIndex={currentStatusIndex}
            onClose={handlePreviewClose}
            onNext={handlePreviewNext}
            onPrev={handlePreviewPrev}
            onDelete={handleDeleteStatus}
            theme={theme}
            currentUser={user}
            loading={loading}
          />
        )
      }
    >
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
        className={`w-full h-screen flex flex-col border-r ${isDark ? "bg-surface-list-dark border-gray-800" : "bg-surface-list-light border-gray-200"
          }`}
      >
        {/* Header */}
        <div className={`px-4 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
          <h2 className={`text-lg font-semibold ${isDark ? "text-white" : "text-gray-900"}`}>Status</h2>
          <p className={`text-xs mt-0.5 ${isDark ? "text-gray-500" : "text-gray-400"}`}>
            Share updates that disappear after 24 hours
          </p>
        </div>

        {error && (
          <div className="mx-4 mt-3 bg-red-500/10 border border-red-500/20 text-red-500 px-4 py-3 rounded-xl flex items-center justify-between">
            <span className="text-sm">{error}</span>
            <button onClick={clearError} className="text-red-400 hover:text-red-300">
              <RxCross2 className="h-4 w-4" />
            </button>
          </div>
        )}

        <div className="overflow-y-auto flex-1 scrollbar-thin">
          {/* My Status */}
          <div className={`px-4 py-4 border-b ${isDark ? "border-gray-800" : "border-gray-200"}`}>
            <div
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors ${isDark ? "hover:bg-white/5" : "hover:bg-gray-50"
                }`}
              onClick={() => userStatuses ? handleStatusPreview(userStatuses) : setShowcreateModal(true)}
            >
              {/* Outer ring container — larger than the image to show gap */}
              <div className="relative flex-shrink-0 w-16 h-16 flex items-center justify-center">
                {/* Profile image — smaller to leave a gap from the ring */}
                <img
                  src={user?.profilePicture}
                  alt={user?.username}
                  className="w-12 h-12 rounded-full object-cover z-10 relative"
                />
                {userStatuses && (
                  <svg className="absolute inset-0 w-full h-full" viewBox="0 0 100 100">
                    {userStatuses.statuses.map((_, index) => {
                      const circumference = 2 * Math.PI * 47;
                      const segmentLength = circumference / userStatuses.statuses.length;
                      const offset = index * segmentLength;
                      return (
                        <circle
                          key={index}
                          cx="50" cy="50" r="47"
                          fill="none"
                          stroke="#7C3AED"
                          strokeWidth="4"
                          strokeDasharray={`${segmentLength - 4} 4`}
                          strokeDashoffset={-offset}
                          transform="rotate(-90 50 50)"
                        />
                      )
                    })}
                  </svg>
                )}
                <button
                  className="absolute bottom-1 right-1 bg-chatriv-purple text-white p-1 rounded-full shadow-soft border-2 border-white dark:border-[#121418] z-20"
                  onClick={(e) => { e.stopPropagation(); setShowcreateModal(true) }}
                >
                  <FaPlus className="h-2.5 w-2.5" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${isDark ? "text-white" : "text-gray-900"}`}>My Status</p>
                <p className={`text-xs mt-0.5 ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                  {userStatuses
                    ? `${userStatuses.statuses.length} update${userStatuses.statuses.length > 1 ? 's' : ''} · ${formatTimestamp(
                      userStatuses.statuses[userStatuses.statuses.length - 1].timestamp
                    )}`
                    : "Tap to add a status update"}
                </p>
              </div>

              {userStatuses && (
                <button
                  onClick={(e) => { e.stopPropagation(); setShowOption(!showOption) }}
                  className={`p-2 rounded-lg transition-colors ${isDark ? "hover:bg-white/10 text-gray-400" : "hover:bg-gray-100 text-gray-500"
                    }`}
                >
                  <FaEllipsisH className="h-4 w-4" />
                </button>
              )}
            </div>

            {showOption && userStatuses && (
              <div className={`mt-2 rounded-xl overflow-hidden ${isDark ? "bg-white/[0.03]" : "bg-gray-50"
                }`}>
                <button
                  className={`w-full text-left py-2.5 px-4 flex items-center gap-2 text-sm transition-colors ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                    }`}
                  onClick={() => { setShowcreateModal(true); setShowOption(false) }}
                >
                  <FaCamera className="text-chatriv-purple" /> Add Status
                </button>
                <button
                  className={`w-full text-left py-2.5 px-4 flex items-center gap-2 text-sm transition-colors ${isDark ? "hover:bg-white/5 text-gray-200" : "hover:bg-gray-100 text-gray-700"
                    }`}
                  onClick={() => { handleStatusPreview(userStatuses); setShowOption(false) }}
                >
                  View Status
                </button>
              </div>
            )}
          </div>

          {loading && (
            <div className="flex justify-center items-center p-12">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-chatriv-purple border-t-transparent" />
            </div>
          )}

          {/* Recent updates */}
          {!loading && otherStatuses.length > 0 && (
            <div className="py-2">
              <p className={`text-xs font-semibold uppercase tracking-wider px-4 py-2 ${isDark ? "text-gray-500" : "text-gray-400"
                }`}>
                Recent Updates
              </p>
              {otherStatuses.map((contact) => (
                <StatusList
                  key={contact?.id}
                  contact={contact}
                  onPreview={() => handleStatusPreview(contact)}
                  theme={theme}
                  currentUserId={user?._id}
                />
              ))}
            </div>
          )}

          {/* Empty state */}
          {!loading && statuses.length === 0 && (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? "bg-chatriv-purple/15" : "bg-chatriv-purple-light"
                }`}>
                <HiOutlineSignal className="h-8 w-8 text-chatriv-purple" />
              </div>
              <h3 className={`text-base font-semibold mb-1 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                No status updates yet
              </h3>
              <p className={`text-sm ${isDark ? "text-gray-500" : "text-gray-400"}`}>
                Be the first to share a status update
              </p>
              <button
                onClick={() => setShowcreateModal(true)}
                className="mt-4 px-4 py-2 bg-chatriv-purple text-white text-sm font-medium rounded-xl hover:bg-chatriv-purple-dark transition-colors"
              >
                Create Status
              </button>
            </div>
          )}
        </div>

        {/* Create modal */}
        {showCreatedModal && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
            <div className={`p-6 rounded-2xl max-w-md w-full mx-4 shadow-card ${isDark ? "bg-[#1A1D23] text-white" : "bg-white text-gray-900"
              }`}>
              <h3 className="text-lg font-semibold mb-4">Create Status</h3>

              {filePreview && (
                <div className="mb-4 rounded-xl overflow-hidden">
                  {selectedFile?.type.startsWith("video/") ? (
                    <video src={filePreview} controls className="w-full h-40 object-cover" />
                  ) : (
                    <img src={filePreview} alt="file-preview" className="w-full h-40 object-cover" />
                  )}
                </div>
              )}

              <div className="relative mb-4">
                <div className="flex items-center gap-2 mb-1">
                  <button
                    type="button"
                    onClick={() => setShowStatusEmoji((v) => !v)}
                    className={`flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg transition-colors ${isDark ? "text-gray-400 hover:text-yellow-400 hover:bg-white/5" : "text-gray-500 hover:text-yellow-500 hover:bg-gray-100"
                      }`}
                  >
                    <FaSmile className="h-4 w-4" />
                    Emoji
                  </button>
                </div>

                {showStatusEmoji && (
                  <div className="z-10">
                    <EmojiPicker
                      onEmojiClick={(emojiObject) => {
                        setNewStatus((prev) => prev + emojiObject.emoji);
                        setShowStatusEmoji(false);
                      }}
                      theme={theme}
                      width="100%"
                      height={320}
                    />
                  </div>
                )}
              </div>

              <textarea
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                placeholder="What's on your mind?"
                className={`w-full p-3 rounded-xl mb-4 text-sm focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 resize-none ${isDark
                  ? "bg-surface-input-dark text-white placeholder-gray-500 border border-gray-800"
                  : "bg-surface-input-light text-gray-900 placeholder-gray-400 border border-gray-200"
                  }`}
                rows={3}
              />

              <label className={`flex items-center gap-2 px-3 py-2.5 rounded-xl mb-4 cursor-pointer text-sm transition-colors ${isDark ? "bg-white/5 hover:bg-white/10 text-gray-300" : "bg-gray-50 hover:bg-gray-100 text-gray-600"
                }`}>
                <FaCamera className="text-chatriv-purple" />
                Add photo or video
                <input type="file" accept="image/*,video/*" onChange={handleFileChange} className="hidden" />
              </label>

              <div className="flex justify-end gap-3">
                <button
                  onClick={() => {
                    setShowcreateModal(false)
                    setNewStatus("")
                    setSelectedFile(null)
                    setFilePreview(null)
                  }}
                  disabled={loading}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${isDark ? "text-gray-400 hover:text-gray-200" : "text-gray-500 hover:text-gray-700"
                    }`}
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateStatus}
                  disabled={loading || (!newStatus.trim() && !selectedFile)}
                  className="px-4 py-2 bg-chatriv-purple text-white text-sm font-medium rounded-xl hover:bg-chatriv-purple-dark disabled:opacity-50 transition-colors"
                >
                  {loading ? "Creating..." : "Create"}
                </button>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </Layout>
  )
}
