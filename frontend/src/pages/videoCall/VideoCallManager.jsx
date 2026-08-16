import React, { useCallback, useEffect } from 'react'
import useVideoCallStore from '../../store/videoCallStore'
import useUserStore from '../../store/useUserStore';
import VideoCallModal from './VideoCallModal'
import {
    playIncomingRingtone,
    stopIncomingRingtone,
    playOutgoingRingtone,
    stopOutgoingRingtone
} from '../../utils/callSounds';

export default function VideoCallManager({ socket }) {
    const { setIncomingCall, setCurrentCall, setCallType, setCallModalOpen, endCall, setCallStatus } = useVideoCallStore();
    const { user } = useUserStore();

    useEffect(() => {
        if (!socket) return;


        // handle incomig call 
        const handleIncomingCall = ({ callerId, callerName, callerAvatar, callType, callId }) => {
            setIncomingCall({
                callerId,
                callerName,
                callerAvatar,
                callId
            })

            playIncomingRingtone();

            setCallType(callType)
            setCallModalOpen(true)
            setCallStatus("ringing")
        }

        const handleCallEnded = ({ reason }) => {
            stopOutgoingRingtone();
            setCallStatus("failed")
            setTimeout(() => {
                endCall();
            }, 2000)
        }

        socket.on("incoming_call", handleIncomingCall)
        socket.on("call_failed", handleCallEnded)

        return () => {
            socket.off("incoming_call", handleIncomingCall)
            socket.off("call_failed", handleCallEnded)
        }
    }, [socket, setIncomingCall, setCallType, setCallModalOpen, setCallStatus, endCall]);

    // memorize function to initiate the call 
    const initiateCall = useCallback((receiverId, receiverName, receiverAvatar, callType = "video") => {
        const callId = `${user?._id}-${receiverId}-${Date.now()}`;

        const callData = {
            callId,
            participantId: receiverId,
            participantName: receiverName,
            participantAvatar: receiverAvatar
        }

        setCurrentCall(callData)
        setCallType(callType)
        setCallModalOpen(true)
        setCallStatus("calling")

        // outgoing ringtone
        playOutgoingRingtone();

        //emit the call initiate
        socket.emit("initiate_call", {
            callerId: user?._id,
            receiverId,
            callType,
            callId,
            callerInfo: {
                username: user.username,
                profilePicture: user.profilePicture
            }
        })
    }, [user, socket, setCurrentCall, setCallType, setCallModalOpen, setCallStatus])

    //expose the initiate call funtion to store the data 
    useEffect(() => {
        useVideoCallStore.getState().initiateCall = initiateCall
    }, [initiateCall]);



    return <VideoCallModal socket={socket} />
}
