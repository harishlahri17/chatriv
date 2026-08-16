import BaseUrl from "./url.service";


export const sendOtp = async (phoneNumber, phoneSuffix, email) => {
    try {
        const response = await BaseUrl.post("/auth/send-otp", { phoneNumber, phoneSuffix, email })
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export const verifyOtp = async (phoneNumber, phoneSuffix, otp, email) => {
    try {
        const response = await BaseUrl.post("/auth/verify-otp", { phoneNumber, phoneSuffix, otp, email });
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export const updateUserProfile = async (updateData) => {
    try {
        const response = await BaseUrl.put("/auth/update-profile", updateData);
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export const checkUserAuth = async () => {
    try {
        const response = await BaseUrl.post("/auth/check-auth");
        // if(response.data.status === 'success'){
        //     return {isAuthenticated: true, user: response?.data?.data}
        // }
        if (response.data.success) {
            return { isAuthenticated: true, user: response.data.user }
        }
        else if (response.data.status === 'error') {
            return { isAuthenticated: false }
        }
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export const logoutUser = async () => {
    try {
        const response = await BaseUrl.get("/auth/logout");
        localStorage.removeItem("auth_token");
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}


export const getAllUsers = async () => {
    try {
        const response = await BaseUrl.get("/auth/users");
        return response.data
    } catch (error) {
        throw error.response ? error.response.data : error.message;
    }
}