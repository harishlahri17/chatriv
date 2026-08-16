import { io } from 'socket.io-client'
import useUserStore from '../store/useUserStore';

let socket = null;

export const initializeSocket = () => {
    if (socket) return socket;

    const user = useUserStore.getState().user;
    const token =  localStorage.getItem("auth_token")

    const BACKEND_URL = process.env.REACT_APP_BACKEND_API_URL;
    socket = io(BACKEND_URL, {
        // withCredentials: true,
        auth:{token},
        transports: ["websocket", "polling"],
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
    })

    // connection events 
    socket.on("connect", () => {
        console.log("socket connected", socket.io)
        socket.emit("user_connected", user._id)
    })

    socket.on("connect_error", (error) => {
        console.log("socket connection error", error)
    })

    //disconnection event
    socket.on("disconnect", (reason) => {
        console.log("socket disconnect", reason)
    })

    return socket;
}

export const getSocket = () => {
    if (!socket) {
        return initializeSocket();
    }
    return socket;
}

export const disconnectSocket = () => {
    if (socket) {
        socket.disconnect();
        socket = null;
    }
}