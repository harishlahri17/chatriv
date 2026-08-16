let incomingAudio = null;
let outgoingAudio = null;

export const playIncomingRingtone = () => {
    stopIncomingRingtone();

    incomingAudio = new Audio("/sounds/incoming_call_ringtone.mp3");
    incomingAudio.loop = true;
    incomingAudio.volume = 0.8;

    incomingAudio.play().catch((error) => {
        console.log("Incoming ringtone autoplay blocked:", error);
    });
};

export const stopIncomingRingtone = () => {
    if (incomingAudio) {
        incomingAudio.pause();
        incomingAudio.currentTime = 0;
        incomingAudio = null;
    }
};

export const playOutgoingRingtone = () => {
    stopOutgoingRingtone();

    outgoingAudio = new Audio("/sounds/outgoing_call_ringtone.mp3");
    outgoingAudio.loop = true;
    outgoingAudio.volume = 0.6;

    outgoingAudio.play().catch((error) => {
        console.log("Outgoing ringtone autoplay blocked:", error);
    });
};

export const stopOutgoingRingtone = () => {
    if (outgoingAudio) {
        outgoingAudio.pause();
        outgoingAudio.currentTime = 0;
        outgoingAudio = null;
    }
};

export const stopAllCallSounds = () => {
    stopIncomingRingtone();
    stopOutgoingRingtone();
};