import { format } from 'date-fns';
import React, { useRef, useState } from 'react'
import { FaCheck, FaCheckDouble, FaPlus, FaRegCopy, FaSmile } from 'react-icons/fa';
import { HiDotsVertical } from "react-icons/hi";
import useOutsideClick from '../../hooks/useOutsideClick';
import { RxCross2 } from "react-icons/rx";
import EmojiPicker from 'emoji-picker-react'

export default function MessageBubble({ message, theme, onReact, currentUser, deleteMessage }) {
    const quickReactions = ["👍", "❤️", "😂", "😮", "😢", "🙏"];
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    const [showReactions, setShowReactions] = useState(false);
    const [showOptions, setShowOptions] = useState(false);
    const messageRef = useRef(null);
    const optionRef = useRef(null);
    const emojiPickerRef = useRef(null);
    const reactionsMenuRef = useRef(null);
    const isUserMessage = message.sender._id === currentUser?._id;

    useOutsideClick(emojiPickerRef, () => {
        if (showEmojiPicker) setShowEmojiPicker(false)
    })
    useOutsideClick(reactionsMenuRef, () => {
        if (showReactions) setShowReactions(false)
    })
    useOutsideClick(optionRef, () => {
        if (showOptions) setShowOptions(false)
    })

    const bubbleClass = isUserMessage ? `chat-end` : `chat-start`

    const bubbleContentClass = isUserMessage
        ? `chat-bubble md:max-w-[50%] min-w-[130px] bg-[#DCCBFF] text-[#17121F] shadow-sm`
        : `chat-bubble md:max-w-[50%] min-w-[130px] ${theme === 'dark'
            ? "bg-[#252B36] text-gray-100"
            : "bg-white text-gray-900 shadow-sm"
        }`


    const handleReact = (emoji) => {
        onReact(message._id, emoji)
        setShowEmojiPicker(false)
        setShowReactions(false)
    }
    if (message === 0) return;

    return (
        <div className={`chat ${bubbleClass}`}>
            <div className={`${bubbleContentClass} relative group`} ref={messageRef}>
                <div className='flex justify-center gap-2'>
                    {message.contentType === 'text' && <p className='mr-2'>{message.content}</p>}
                    {message.contentType === 'image' && (
                        <div>
                            <img
                                src={message.imageOrVideoUrl}
                                alt="image-video"
                                className='rounded-lg max-w-xs'
                            />
                            <p className='mt-1'>{message.content}</p>
                        </div>
                    )}
                    {message.contentType === 'video' && (
                        <div>
                            <video
                                src={message.imageOrVideoUrl}
                                alt="image-video"
                                controls
                                className='rounded-lg max-w-xs'
                            />
                            <p className='mt-1'>{message.content}</p>
                        </div>
                    )}
                </div>
                <div className='self-end flex items-center justify-end gap-1 text-xs opacity-60 mt-2 ml-2'>
                    <span>{format(new Date(message.createdAt), "HH:mm")}</span>
                    {isUserMessage && (
                        <>
                            {message.messageStatus === "send" && <FaCheck size={13} />}
                            {message.messageStatus === "delivered" && <FaCheckDouble size={13} />}
                            {message.messageStatus === "read" && <FaCheckDouble size={13} className="text-[#2563EB]" />}
                        </>
                    )}
                </div>

                <div className='absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20'>
                    <button onClick={() => setShowOptions((prev) => !prev)}
                        className={`p-1 rounded-full ${theme === 'dark' ? "text-white" : "text-gray-800"}`}
                    >
                        <HiDotsVertical size={18} />
                    </button>
                </div>

                <div className={`absolute ${isUserMessage ? "-left-10" : "-right-10"} top-1/2 transform 
                -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-2`}>
                    <button
                        onClick={() => setShowReactions(!showReactions)}
                        className={`p-2 rounded-full ${theme === 'dark'
                            ? "bg-[#202c33] hover:bg-[#202c33]/80"
                            : "bg-white hove:bg-gray-100"}shadow-lg`}
                    >
                        <FaSmile className={`${theme === 'dark' ? "text-gray-300" : "text-gray-600"}`} />
                    </button>
                </div>

                {showReactions && (
                    <div ref={reactionsMenuRef}
                        className={`absolute -top-8 ${isUserMessage ? "left-0" : "left-36"} 
                    transform -translate-x-1/2 flex items-center bg-[#202c33]/90 
                    rounded-full px-2 py-1.5 gap-1 shadow-lg z-50`}>

                        {quickReactions.map((emoji, index) => (
                            <button key={index}
                                onClick={() => handleReact(emoji)}
                                className='hover:scale-125 transition-transform p-1'
                            >
                                {emoji}
                            </button>
                        ))}
                        <div className='w-[1px] h-5 bg-gray-600 mx-1' />
                        <button onClick={() => setShowEmojiPicker(true)} className='hover:bg-[#ffffffa] rounded-full p-1'>
                            <FaPlus className='h-4 w-4 text-gray-300' />
                        </button>
                    </div>
                )}
                {showEmojiPicker && (
                    <div ref={emojiPickerRef} className='absolute left-0 bottom-16 z-50'>
                        <div className="relative">
                            <EmojiPicker
                                onEmojiClick={(emojiObject) => handleReact(emojiObject.emoji)}
                                theme={theme}
                            />
                            <button onClick={() => setShowEmojiPicker(false)}
                                className='absolute top-2 right-2 text-gray-500 hover:text-gray-700'
                            >
                                <RxCross2 />
                            </button>
                        </div>
                    </div>
                )}
                {message.reactions && message.reactions.length > 0 && (
                    <div className={`absolute -bottom-5 ${isUserMessage ? "right-2" : "left-2"} 
                    ${theme === 'dark' ? "bg-[#2a3942]" : "bg-gray-200"} rounded-full px-2 shadow-md`}>
                        {message.reactions.map((reaction, index) => (
                            <span key={index} className='mr-1'>
                                {reaction.emoji}
                            </span>
                        ))}
                    </div>
                )}
                {showOptions && (
                    <div ref={optionRef}
                        className={`absolute top-8 right-1 z-50 w-36 rounded-xl shadow-lg py-2 text-sm
                        ${theme === 'dark' ? "bg-[#1d1f1f] text-white" : "bg-gray-100 text-black"}`}
                    >
                        <button onClick={() => {
                            if (message.contentType === 'text') {
                                navigator.clipboard.writeText(message.content)
                            }
                            setShowOptions(false)
                        }}
                            className='flex items-center w-full px-4 py-2 gap-3 rounded-lg'
                        >
                            <FaRegCopy size={14} />
                            <span>Copy</span>
                        </button>

                        <button onClick={() => {
                            deleteMessage(message?._id)
                            setShowOptions(false)
                        }}
                            className='flex items-center w-full px-4 py-2 gap-3 rounded-lg text-red-600'
                        >
                            <FaRegCopy className='text-red-600' size={14} />
                            <span>Delete</span>
                        </button>
                    </div>
                )}
            </div>
        </div>

    )
}
