import { create } from 'zustand';
import { getSocket } from '../services/chat.service';
import BaseUrl from '../services/url.service';
import useUserStore from './useUserStore'


const useStatusStore = create((set, get) => ({

    // state 
    statuses: [],
    loading: false,
    error: null,

    // active 
    setStatus: (statuses) => set({ statuses }),
    setLoading: (loading) => set({ loading }),
    setError: (error) => set({ error }),

    //initialize the socket listners
    initializeSocket: () => {
        const socket = getSocket();
        if (!socket) return;

        //realtime status event
        socket.on("new_status", (newStatus) => {
            set((state) => ({
                statuses: state.statuses.some((s) => s._id === newStatus._id)
                    ? state.statuses
                    : [...state.statuses, newStatus]
            }));
        });

        socket.on("new_deleted", (statusId) => {
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId)

            }));
        });


        socket.on("status_viewed", (viewData) => {
            set((state) => ({
                statuses: state.statuses.map((status) =>
                    status._id === viewData.statusId
                        ? {
                            ...status,
                            viewers: viewData.viewers
                        }
                        : status
                )
            }));
        });

    },

    cleanupSocket: () => {
        const socket = getSocket();
        if (socket) {
            socket.off("new_status");
            socket.off("new_deleted");
            socket.off("status_viewed");
        }
    },

    //fetch status
    fetchStatuses: async () => {
        set({ loading: true, error: null })
        try {
            const { data } = await BaseUrl.get("status");
            set({ statuses: data.data || [], loading: false })
        } catch (error) {
            console.error("Error fetching status", error)
            set({ error: error.message, loading: false })
        }
    },

    // create status 
    createStatus: async (statusData) => {
        set({ loading: true, error: null })
        try {
            const formData = new FormData();
            if (statusData.file) {
                formData.append("media", statusData.file)
            }
            if (statusData.content?.trim()) {
                formData.append("content", statusData.content)
            }

            const { data } = await BaseUrl.post("/status", formData,
                { headers: { "Content-Type": "multipart/form-data" } }
            );

            // add to status in local state 
            if (data.data) {
                set((state) => ({
                    statuses: state.statuses.some((s) => s._id === data.data._id)
                        ? state.statuses : [data.data, ...state.statuses]
                }))
            }
            set({ loading: false })
            return data.data;

        } catch (error) {
            console.error("Error on creating status", error)
            set({ error: error.message, loading: false })
            throw error;
        }
    },

    //view status 
    viewStatus: async (statusId) => {
        try {
            set({
                loading: true,
                error: null
            });

            const { data } = await BaseUrl.put(
                `status/${statusId}/view`
            );

            const viewedAt = data?.data?.viewedAt || new Date();

            set((state) => ({
                statuses: state.statuses.map((status) => {

                    if (status._id !== statusId) {
                        return status;
                    }

                    // current logged-in user
                    const currentUserId =
                        useUserStore.getState().user?._id;

                    if (!currentUserId) {
                        return status;
                    }

                    const alreadyExists = status.viewers?.some(
                        (viewer) =>
                            String(viewer?.user?._id || viewer?.user || viewer) ===
                            String(currentUserId)
                    );

                    if (alreadyExists) {
                        return status;
                    }

                    return {
                        ...status,
                        viewers: [
                            ...(status.viewers || []),
                            {
                                user: currentUserId,
                                viewedAt
                            }
                        ]
                    };
                })
            }));

            set({
                loading: false
            });

        } catch (error) {
            console.error("Error viewing status:", error);

            set({
                error: error.message,
                loading: false
            });
        }
    },

    //delete status
    deleteStatus: async (statusId) => {
        try {
            set({ loading: true, error: null })
            await BaseUrl.delete(`/status/${statusId}`);
            set((state) => ({
                statuses: state.statuses.filter((s) => s._id !== statusId)

            }));
            set({ loading: false })
        } catch (error) {
            console.error("Error on deleting status", error)
            set({ error: error.message, loading: false })
            throw error;
        }
    },

    getStatusViewers: async (statusId) => {
        try {
            set({ loading: true, error: null })
            const { data } = await BaseUrl.get(`/status/${statusId}/viewers`);
            set({ loading: false })
            return data.data;
        } catch (error) {
            console.error("Error on getting status viewers", error)
            set({ error: error.message, loading: false })
            throw error;
        }
    },

    //helper function for grouped status 
    getGroupedStatus: () => {
        const { statuses } = get();
        // Oldest status first
        // 1st uploaded -> 1st
        // 2nd uploaded -> 2nd
        // 3rd uploaded -> 3rd
        const sortedStatuses = [...statuses].sort(
            (a, b) => new Date(a.createdAt) - new Date(b.createdAt)
        );

        return sortedStatuses.reduce((acc, status) => {

            const statusUserId = status.user?._id;

            if (!acc[statusUserId]) {
                acc[statusUserId] = {
                    id: statusUserId,
                    name: status?.user?.username,
                    avatar: status?.user?.profilePicture,
                    statuses: []
                };
            }

            acc[statusUserId].statuses.push({
                id: status._id,
                media: status.content,
                contentType: status.contentType,
                timestamp: status.createdAt,
                viewers: status.viewers || []
            });
            return acc;
        }, {});
    },

    getUserStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return userId ? groupedStatus[userId] : null;
    },

    getOtherStatuses: (userId) => {
        const groupedStatus = get().getGroupedStatus();
        return Object.values(groupedStatus).filter(
            (contact) => contact.id !== userId
        )
    },

    //clear error
    clearError: () => set({ error: null }),

    reset: () => set({
        statuses: [],
        loading: false,
        error: null,
    })

}));

export default useStatusStore;