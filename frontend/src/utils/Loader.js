import React from "react";
import { motion } from "framer-motion";
import { BsChatDotsFill } from "react-icons/bs";
import useThemeStore from "../store/themeStore";

export default function Loader({ progress = 0 }) {
    const { theme } = useThemeStore();
    const isDark = theme === "dark";

    return (
        <div
            className={`fixed inset-0 flex flex-col items-center justify-center z-50 overflow-hidden ${
                isDark
                    ? "bg-[#0E1012]"
                    : "bg-gradient-to-br from-purple-50/70 via-[#F5F6FA] to-indigo-50/40"
            }`}
        >
            {/* Ambient Background Glow */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-chatriv-purple/15 rounded-full blur-3xl pointer-events-none" />

            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Main Loader Content */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className="relative z-10 flex flex-col items-center"
            >
                {/* Chatriv Logo */}
                <motion.div
                    initial={{ scale: 0.7, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{
                        duration: 0.5,
                        type: "spring",
                        stiffness: 260,
                        damping: 20,
                    }}
                    className="relative mb-5"
                >
                    {/* Glow */}
                    <div className="absolute inset-0 rounded-2xl bg-chatriv-purple/30 blur-xl scale-110" />

                    {/* Logo Box */}
                    <div className="relative w-20 h-20 rounded-2xl bg-gradient-to-tr from-chatriv-purple to-indigo-500 flex items-center justify-center shadow-xl shadow-chatriv-purple/30">
                        <BsChatDotsFill className="w-10 h-10 text-white" />
                    </div>
                </motion.div>

                {/* App Name */}
                <motion.h1
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15, duration: 0.35 }}
                    className={`text-2xl font-bold tracking-tight ${
                        isDark ? "text-white" : "text-gray-900"
                    }`}
                >
                    Chatriv
                </motion.h1>

                {/* Loading Text */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                    className={`text-xs mt-1 mb-6 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                    Connecting you with your people...
                </motion.p>

                {/* Progress Bar */}
                <div
                    className={`w-64 h-1.5 rounded-full overflow-hidden ${
                        isDark ? "bg-gray-800" : "bg-gray-200"
                    }`}
                >
                    <motion.div
                        className="h-full bg-gradient-to-r from-chatriv-purple to-indigo-500 rounded-full"
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{
                            duration: 0.5,
                            ease: "easeOut",
                        }}
                    />
                </div>

                {/* Progress Percentage */}
                <motion.p
                    key={progress}
                    initial={{ opacity: 0.5 }}
                    animate={{ opacity: 1 }}
                    className={`text-xs font-medium mt-3 ${
                        isDark ? "text-gray-400" : "text-gray-500"
                    }`}
                >
                    Loading... {progress}%
                </motion.p>
            </motion.div>
        </div>
    );
}