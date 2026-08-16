import React, { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import formatTimestamp from '../../utils/formatTime';
import { FaChevronDown, FaChevronLeft, FaChevronRight, FaEye, FaTimes, FaTrash } from 'react-icons/fa'

export default function StatusPreview({ contact, currentIndex, onClose, onPrev, onNext, onDelete, theme, currentUser, loading }) {

    const [progress, setProgress] = useState(0)
    const [showViewers, setShowViewers] = useState(false)

    const currentStatus = contact?.statuses[currentIndex];
    const isOwnerStatus = contact?.id === currentUser?._id;

    useEffect(() => {
        setProgress(0)

        let current = 0;

        const interval = setInterval(() => {
            current += 2 //INCREASE PROCRESS BY 2% event 1--MS 50 steps = 5 second
            setProgress(current)
            if (current >= 100) {
                clearInterval(interval)
                onNext();
            }
        }, 100)
        return () => clearInterval(interval)
    }, [currentIndex, onNext])

    const handleViewersToggle = () => {
        setShowViewers(!showViewers)
    }

    const handleDeleteStatus = async () => {
        if (!onDelete || !currentStatus?.id) {
            return;
        }
        try {
            await onDelete(currentStatus.id);

            if (contact.statuses.length === 1) {
                onClose();
            } else if (currentIndex > 0) {
                onPrev();
            } else {
                onClose();
            }
        } catch (error) {
            console.error("Error deleting status:", error);
        }
    };

    if (!currentStatus) return null;

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5 }}
            exit={{ opacity: 0 }}

            className="fixed inset-0 w-full h-full bg-black/90 z-50 flex items-center justify-center backdrop-blur-sm"
            onClick={onClose}
        >
            <div className='relative w-full h-full max-w-md mx-auto flex justify-center items-center'
                onClick={(e) => e.stopPropagation()}
            >
                <div className="w-full h-full bg-[#0E1012] relative rounded-2xl overflow-hidden">
                    <div className='absolute top-0 left-0 right-0 flex p-3 z-10 gap-1'>
                        {contact?.statuses.map((_, index) => (
                            <div key={index}
                                className='h-0.5 bg-white/20 flex-1 rounded-full overflow-hidden'
                            >
                                <div className='h-full bg-chatriv-purple transition-all duration-100 ease-linear rounded-full'
                                    style={{ width: index < currentIndex ? "100%" : index === currentIndex ? `${progress}%` : "0%" }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className='absolute top-8 left-4 right-16 z-10 flex items-center justify-between'>
                        <div className='flex items-center space-x-3'>
                            <img
                                src={contact?.avatar}
                                alt={contact?.name}
                                className='w-10 h-10 rounded-full object-cover border-2 border-white'
                            />

                            <div>
                                <p className='text-white font-semibold'>{contact?.name}</p>
                                <p className='text-gray-300 text-sm'>{formatTimestamp(currentStatus.timestamp)}</p>
                            </div>
                        </div>

                        {/* status Action  */}
                        {isOwnerStatus && (
                            <div className='flex items-center space-x-2'>
                                <button onClick={handleDeleteStatus}
                                    className='text-white bg-red-500/70 rounded-full p-2 hover:bg-red-500 transition-all'
                                >
                                    <FaTrash className='h-3.5 w-3.5' />
                                </button>
                            </div>
                        )}
                    </div>

                    <div className='w-full h-full flex items-center justify-center'>
                        {currentStatus.contentType === "text" ? (
                            <div className='text-white text-center p-8'>
                                <p className='text-2xl font-medium'>{currentStatus.media}</p>
                            </div>
                        ) : currentStatus.contentType === 'image' ? (
                            <img
                                src={currentStatus.media}
                                alt="status content"
                                className='max-w-full max-h-full object-contain'
                            />
                        ) : currentStatus.contentType === 'video' ? (
                            <video
                                src={currentStatus.media}
                                muted
                                autoPlay
                                controls
                                className='max-w-full max-h-full object-contain'
                            />
                        ) : null}
                    </div>

                    <button onClick={onClose}
                        className='absolute top-12 right-4 text-white bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition-all z-10'
                    >
                        <FaTimes className='h-4 w-4' />
                    </button>

                    {currentIndex > 0 && (
                        <button onClick={onPrev}
                            className='absolute left-3 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition-all'
                        >
                            <FaChevronLeft className='h-4 w-4' />
                        </button>
                    )}
                    {currentIndex < contact.statuses.length - 1 && (
                        <button onClick={onNext}
                            className='absolute right-3 top-1/2 -translate-y-1/2 text-white bg-white/10 rounded-full p-2.5 hover:bg-white/20 transition-all'
                        >
                            <FaChevronRight className='h-4 w-4' />
                        </button>
                    )}

                    {isOwnerStatus && (
                        <div className='absolute bottom-4 left-4 right-4'>
                            <button onClick={handleViewersToggle}
                                className='flex items-center justify-between w-full text-white bg-white/10 rounded-xl px-4 py-2.5 hover:bg-white/15 transition-all'
                            >
                                <div className='flex items-center space-x-2'>
                                    <FaEye className='w-4 h-4' />
                                    <span>{currentStatus?.viewers.length}</span>
                                </div>
                                <FaChevronDown className={`h-4 w-4 transition-transform ${showViewers ? "rotate-180" : ""}`} />
                            </button>
                            <AnimatePresence>
                                {showViewers && (
                                    <motion.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: "auto" }}
                                        exit={{ duration: 0, height: 0 }}
                                        className='mt-2 bg-white/10 backdrop-blur rounded-xl p-4 max-h-40 overflow-y-auto'
                                    >
                                        {loading ? (
                                            <p className='text-white text-center'>Loading Viewers</p>
                                        ) : currentStatus.viewers.length > 0 ? (
                                            <div className='space-y-2'>
                                                {currentStatus.viewers.map((viewer) => (
                                                    <div
                                                        key={viewer.user?._id}
                                                        className="flex items-center justify-between"
                                                    >
                                                        <div className="flex items-center space-x-3">
                                                            <img
                                                                src={viewer.user?.profilePicture}
                                                                alt={viewer.user?.username}
                                                                className="h-8 w-8 rounded-full object-cover"
                                                            />

                                                            <div>
                                                                <p className="text-white text-sm">
                                                                    {viewer.user?.username}
                                                                </p>

                                                                <p className="text-gray-400 text-xs">
                                                                    Viewed {formatTimestamp(viewer.viewedAt)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        ) : (
                                            <p className='text-white text-center'>No Views</p>
                                        )}
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </motion.div>
    )
}
