import React from 'react';
import formatTimestamp from '../../utils/formatTime';

export default function StatusList({ contact, onPreview, theme, currentUserId }) {
    const isDark = theme === 'dark';

    // Make sure statuses are always oldest -> newest
    const sortedStatuses = [...(contact?.statuses || [])].sort(
        (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
    );

    const getViewerId = (viewer) => {
        return viewer?.user?._id || viewer?.user;
    };

    return (
        <div
            className={`flex items-center gap-3 px-4 py-3 cursor-pointer rounded-xl transition-colors 
                ${isDark
                    ? 'hover:bg-white/[0.04]'
                    : 'hover:bg-gray-50'
                }`}
            onClick={onPreview}
        >
            {/* Status ring */}
            <div className="relative flex-shrink-0 w-14 h-14 flex items-center justify-center">
                {/* Profile image */}
                <img
                    src={contact?.avatar}
                    alt={contact?.name}
                    className="w-10 h-10 rounded-full object-cover z-10 relative"
                />
                {/* Segmented status ring */}
                {sortedStatuses.length > 0 && (
                    <svg
                        className="absolute inset-0 w-full h-full"
                        viewBox="0 0 100 100"
                    >
                        {sortedStatuses.map((status, index) => {
                            const totalStatuses = sortedStatuses.length;
                            const circumference = 2 * Math.PI * 47;
                            const gap = totalStatuses === 1 ? 0 : (totalStatuses > 8 ? 2 : 4);
                            const segmentLength = circumference / totalStatuses;
                            const dashLength = segmentLength - gap;
                            const offset = index * segmentLength;

                            // Check whether CURRENT USER has viewed THIS status
                            const isViewed = status.viewers?.some(
                                (viewer) =>
                                    String(getViewerId(viewer)) ===
                                    String(currentUserId)
                            );

                              return (
                                <circle
                                    key={status.id || index}
                                    cx="50"
                                    cy="50"
                                    r="47"
                                    fill="none"
                                    // Viewed = gray (#9CA3AF / #6B7280)
                                    // Unviewed = purple (#7C3AED)
                                    stroke={isViewed ? (isDark ? "#6B7280" : "#9CA3AF") : "#7C3AED"}
                                    strokeWidth="4"
                                    strokeDasharray={
                                        totalStatuses === 1
                                            ? undefined
                                            : `${dashLength} ${circumference - dashLength}`
                                    }
                                    strokeDashoffset={totalStatuses === 1 ? undefined : -offset}
                                    transform={totalStatuses === 1 ? undefined : "rotate(-90 50 50)"}
                                    className="transition-all duration-300"
                                />
                            );
                        })}
                    </svg>
                )}
            </div>

            {/* Text */}
            <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {contact?.name}
                </p>
                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {sortedStatuses.length} update
                    {sortedStatuses.length > 1 ? 's' : ''} ·{' '}
                    {formatTimestamp(
                        sortedStatuses[sortedStatuses.length - 1]
                            ?.timestamp
                    )}
                </p>
            </div>
        </div>
    );
}