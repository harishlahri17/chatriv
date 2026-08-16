import { useEffect } from "react";

const useOutsideClick = (ref, callback) => {
    useEffect(() => {
        const handleOutSideClick = (event) => {
            if(ref.current && !ref.current.contains(event.target)){
                callback();
            }
        }

        document.addEventListener("mousedown", handleOutSideClick)
        return () => {
            document.removeEventListener("mousedown", handleOutSideClick)
        }
    }, [ref, callback])
}

export default useOutsideClick;