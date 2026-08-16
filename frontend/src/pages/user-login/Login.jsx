import React, { useState } from 'react'
import useLoginStore from '../../store/useLoginStore'
import countries from '../../utils/countries'
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup'
import {useNavigate } from 'react-router-dom';
import useUserStore from '../../store/useUserStore';
import { useForm } from 'react-hook-form';
import useThemeStore from '../../store/themeStore';
import { motion } from "framer-motion";
import { FaArrowLeft, FaChevronDown, FaPlus, FaSpinner, FaUser, FaEnvelope, FaSearch} from "react-icons/fa";
import { BsChatDotsFill } from "react-icons/bs";
import ReactCountryFlag from "react-country-flag";
import { sendOtp, updateUserProfile, verifyOtp } from '../../services/user.service';
import { toast } from 'react-toastify';

const loginValidationSchema = yup
    .object()
    .shape({
        phoneNumber: yup
            .string()
            .nullable()
            .notRequired()
            .matches(/^\d+$/, "Phone number must contain only digits")
            .transform((value, originalValue) =>
                originalValue.trim() === "" ? null : value
            ),
        email: yup
            .string()
            .nullable()
            .notRequired()
            .email("Please enter a valid email address")
            .transform((value, originalValue) =>
                originalValue.trim() === "" ? null : value
            )
    }).test(
        "at-least-one",
        "Either email or phone number is required",
        function (value) {
            return !!(value?.phoneNumber || value?.email)
        }
    )

const otpValidationSchema = yup.object().shape({
    otp: yup.string().length(6, "OTP must be 6 digits").required("OTP is required")
});

const profileValidationSchema = yup.object().shape({
    username: yup.string().required("Username is required"),
    agreed: yup.bool().oneOf([true], "You must agree to the terms"),
});

const avatars = [
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Felix',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Aneka',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Mimi',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Jasper',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Luna',
    'https://api.dicebear.com/6.x/avataaars/svg?seed=Zoe',
]

export default function Login() {
    const { step, setStep, userPhoneData, setUserPhoneData, resetLoginState } = useLoginStore();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [selectedCountry, setSelectedCountry] = useState(countries[0]);
    const [otp, setOtp] = useState(["", "", "", "", "", ""]);
    const [email, setEmail] = useState("");
    const [profilePicture, setProfilePicture] = useState(null);
    const [selectedAvatar, setSelectedAvatar] = useState(avatars[0]);
    const [profilePictureFile, setProfilePictureFile] = useState(null);
    const [showDropdown, setShowdropdown] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const { setUser } = useUserStore();
    const { theme } = useThemeStore();
    const isDark = theme === 'dark';

    const {
        register: loginRegister,
        handleSubmit: handleLoginSubmit,
        formState: { errors: loginErrors }
    } = useForm({
        resolver: yupResolver(loginValidationSchema)
    })

    const {
        handleSubmit: handleOtpSubmit,
        formState: { errors: otpErrors },
        setValue: setOtpValue
    } = useForm({
        resolver: yupResolver(otpValidationSchema)
    })

    const {
        register: profileRegister,
        handleSubmit: handleProfileSubmit,
        formState: { errors: profileErrors },
        watch
    } = useForm({
        resolver: yupResolver(profileValidationSchema)
    })

    const filterCountry = countries.filter(
        (country) =>
            country.name.toLocaleLowerCase().includes(searchTerm.toLocaleLowerCase()) ||
            country.dialCode.includes(searchTerm)
    )

    const ProgressBar = () => (
        <div className={`w-full ${isDark ? "bg-gray-800" : "bg-gray-100"} rounded-full h-1.5 mb-6 overflow-hidden`}>
            <div
                className="h-1.5 bg-gradient-to-r from-chatriv-purple to-indigo-500 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${(step / 3) * 100}%` }}
            />
        </div>
    )

    const onLoginSubmit = async () => {
        try {
            setLoading(true);
            setError("");
            if (email) {
                const response = await sendOtp(null, null, email);
                if (response?.success) {
                    toast.info("OTP sent to your email");
                    setUserPhoneData({ email });
                    setStep(2)
                }
            } else {
                const response = await sendOtp(phoneNumber, selectedCountry.dialCode);
                if (response?.success) {
                    toast.info("OTP sent to your phone number");
                    setUserPhoneData({ phoneNumber, phoneSuffix: selectedCountry.dialCode });
                    setStep(2)
                }
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "Failed to send OTP")
        } finally {
            setLoading(false)
        }
    }

    const onOtpSubmit = async () => {
        try {
            setLoading(true);
            setError("");
            if (!userPhoneData) {
                throw new Error("Phone or Email data is missing");
            }
            const otpString = otp.join("");
            let response;
            if (userPhoneData?.email) {
                response = await verifyOtp(null, null, otpString, userPhoneData.email)
            } else {
                response = await verifyOtp(userPhoneData.phoneNumber, userPhoneData.phoneSuffix, otpString)
            }

            if (response?.success) {
                toast.success("OTP verified successfully");
                const user = response.data;
                const token = response.token;
                localStorage.setItem("auth_token", token);
                if (user?.username && user?.profilePicture) {
                    setUser(user);
                    toast.success("Welcome back to Chatriv");
                    navigate('/');
                    resetLoginState();
                } else {
                    setStep(3);
                }
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "Failed to verify OTP")
        } finally {
            setLoading(false)
        }
    }

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProfilePictureFile(file);
            setProfilePicture(URL.createObjectURL(file));
        }
    }

    const handleOtpChange = (index, value) => {
        if (value.length > 1) {
            value = value.slice(-1);
        }
        const newOtp = [...otp];
        newOtp[index] = value;
        setOtp(newOtp);
        setOtpValue("otp", newOtp.join(""));
        if (value && index < 5) {
            const nextEl = document.getElementById(`otp-${index + 1}`);
            if (nextEl) nextEl.focus();
        }
    }

    const handleOtpKeyDown = (index, e) => {
        if (e.key === 'Backspace' && !otp[index] && index > 0) {
            const prevEl = document.getElementById(`otp-${index - 1}`);
            if (prevEl) prevEl.focus();
        }
    }

    const handleBack = () => {
        setStep(1);
        setUserPhoneData(null);
        setOtp(["", "", "", "", "", ""]);
        setError("");
    }

    const onProfileSubmit = async (data) => {
        try {
            setLoading(true);
            setError("");
            const formData = new FormData();
            formData.append("username", data.username)
            formData.append("agreed", data.agreed)
            if (profilePictureFile) {
                formData.append("media", profilePictureFile)
            } else {
                formData.append("profilePicture", selectedAvatar)
            }

            const response = await updateUserProfile(formData);
            if (response?.success) {
                setUser(response.user);
                toast.success("Welcome to Chatriv!");
                navigate("/");
                resetLoginState();
            }
        } catch (error) {
            console.log(error);
            setError(error.message || "Failed to update user profile")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={`min-h-screen ${isDark ? "bg-[#0E1012]" : "bg-gradient-to-br from-purple-50/70 via-[#F5F6FA] to-indigo-50/40"} flex items-center justify-center p-4 relative overflow-hidden`}>
            {/* Ambient background glow */}
            <div className="absolute -top-40 -left-40 w-96 h-96 bg-chatriv-purple/15 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-40 -right-40 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: "easeOut" }}
                className={`w-full max-w-md p-6 md:p-8 rounded-2xl shadow-2xl relative z-10 border ${
                    isDark 
                        ? "bg-[#1A1D23] border-gray-800 text-white" 
                        : "bg-white/95 border-gray-100 text-gray-900 backdrop-blur-md"
                }`}
            >
                {/* Logo & Header */}
                <div className="flex flex-col items-center mb-6">
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.3, type: 'spring', stiffness: 300, damping: 20 }}
                        className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-chatriv-purple to-indigo-500 flex items-center justify-center shadow-lg shadow-chatriv-purple/30 mb-3"
                    >
                        <BsChatDotsFill className="w-8 h-8 text-white" />
                    </motion.div>
                    <h1 className={`text-2xl font-bold tracking-tight ${isDark ? "text-white" : "text-gray-900"}`}>
                        Chatriv
                    </h1>
                    <p className={`text-xs mt-1 text-center ${isDark ? "text-gray-400" : "text-gray-500"}`}>
                        {step === 1 && "Connect with friends and family seamlessly"}
                        {step === 2 && "Verification code sent"}
                        {step === 3 && "Complete your profile"}
                    </p>
                </div>

                <ProgressBar />

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs text-center font-medium">
                        {error}
                    </div>
                )}

                {step === 1 && (
                    <form onSubmit={handleLoginSubmit(onLoginSubmit)} className="space-y-4">
                        <div>
                            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                Phone Number
                            </label>
                            <div className="flex gap-2">
                                {/* Country Selector */}
                                <div className="relative">
                                    <button
                                        type="button"
                                        className={`h-11 px-3 flex items-center gap-2 rounded-xl text-sm font-medium border transition-colors ${
                                            isDark
                                                ? "bg-surface-input-dark border-gray-800 text-gray-200 hover:bg-white/5"
                                                : "bg-surface-input-light border-gray-200 text-gray-800 hover:bg-gray-100"
                                        }`}
                                        onClick={() => setShowdropdown(!showDropdown)}
                                    >
                                        <ReactCountryFlag
                                            countryCode={selectedCountry.alpha2}
                                            svg
                                            style={{ width: "1.2em", height: "1.2em", borderRadius: "2px" }}
                                        />
                                        <span>{selectedCountry.dialCode}</span>
                                        <FaChevronDown className="h-2.5 w-2.5 text-gray-400" />
                                    </button>

                                    {showDropdown && (
                                        <div className={`absolute left-0 mt-1 w-64 rounded-xl shadow-xl z-30 max-h-60 overflow-hidden border ${
                                            isDark ? "bg-[#1F232B] border-gray-700" : "bg-white border-gray-200"
                                        }`}>
                                            <div className="p-2 border-b border-gray-700/50 sticky top-0 bg-inherit flex items-center gap-2">
                                                <FaSearch className="h-3 w-3 text-gray-400 ml-1" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    placeholder="Search countries..."
                                                    className={`w-full bg-transparent text-xs outline-none ${
                                                        isDark ? "text-white placeholder-gray-500" : "text-gray-900 placeholder-gray-400"
                                                    }`}
                                                />
                                            </div>
                                            <div className="max-h-48 overflow-y-auto scrollbar-thin">
                                                {filterCountry.map((country) => (
                                                    <button
                                                        key={country.alpha2}
                                                        type="button"
                                                        className={`w-full text-left px-3 py-2 flex items-center gap-2 text-xs transition-colors ${
                                                            isDark ? "hover:bg-white/5 text-gray-300" : "hover:bg-gray-100 text-gray-700"
                                                        }`}
                                                        onClick={() => {
                                                            setSelectedCountry(country);
                                                            setShowdropdown(false);
                                                        }}
                                                    >
                                                        <ReactCountryFlag
                                                            countryCode={country.alpha2}
                                                            svg
                                                            style={{ width: "1.2em", height: "1.2em" }}
                                                        />
                                                        <span className="font-medium">{country.dialCode}</span>
                                                        <span className="truncate">{country.name}</span>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Phone input */}
                                <div className="flex-1 relative">
                                    <input
                                        type="tel"
                                        {...loginRegister("phoneNumber")}
                                        value={phoneNumber}
                                        onChange={(e) => setPhoneNumber(e.target.value)}
                                        placeholder="Phone number"
                                        className={`w-full h-11 px-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 transition-shadow ${
                                            isDark
                                                ? "bg-surface-input-dark border-gray-800 text-white placeholder-gray-500"
                                                : "bg-surface-input-light border-gray-200 text-gray-900 placeholder-gray-400"
                                        } ${loginErrors.phoneNumber ? "border-red-500" : ""}`}
                                    />
                                </div>
                            </div>
                            {loginErrors.phoneNumber && (
                                <p className="text-red-500 text-xs mt-1">{loginErrors.phoneNumber.message}</p>
                            )}
                        </div>

                        {/* Divider */}
                        <div className="flex items-center gap-3 py-1">
                            <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
                            <span className={`text-xs uppercase tracking-wider ${isDark ? "text-gray-500" : "text-gray-400"}`}>or</span>
                            <div className={`flex-1 h-px ${isDark ? "bg-gray-800" : "bg-gray-200"}`} />
                        </div>

                        {/* Email input */}
                        <div>
                            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                Email Address (Optional)
                            </label>
                            <div className="relative">
                                <FaEnvelope className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                                <input
                                    type="email"
                                    {...loginRegister("email")}
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    placeholder="Enter your email"
                                    className={`w-full h-11 pl-10 pr-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 transition-shadow ${
                                        isDark
                                            ? "bg-surface-input-dark border-gray-800 text-white placeholder-gray-500"
                                            : "bg-surface-input-light border-gray-200 text-gray-900 placeholder-gray-400"
                                    } ${loginErrors.email ? "border-red-500" : ""}`}
                                />
                            </div>
                            {loginErrors.email && (
                                <p className="text-red-500 text-xs mt-1">{loginErrors.email.message}</p>
                            )}
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full mt-2 h-11 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white text-sm font-medium rounded-xl shadow-lg shadow-chatriv-purple/25 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2 h-4 w-4" /> Sending OTP...
                                </>
                            ) : (
                                "Continue"
                            )}
                        </button>
                    </form>
                )}

                {step === 2 && (
                    <form onSubmit={handleOtpSubmit(onOtpSubmit)} className="space-y-4">
                        <div className="text-center">
                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-600"}`}>
                                Enter the 6-digit code sent to
                            </p>
                            <p className={`text-sm font-semibold mt-0.5 ${isDark ? "text-white" : "text-gray-900"}`}>
                                {userPhoneData?.email || `${userPhoneData?.phoneSuffix} ${userPhoneData?.phoneNumber}`}
                            </p>
                        </div>

                        <div className="flex justify-center gap-2 my-4">
                            {otp.map((digit, index) => (
                                <input
                                    key={index}
                                    id={`otp-${index}`}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={digit}
                                    onChange={(e) => handleOtpChange(index, e.target.value)}
                                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                                    className={`w-11 h-12 text-center text-lg font-bold rounded-xl border focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 transition-shadow ${
                                        isDark
                                            ? "bg-surface-input-dark border-gray-800 text-white"
                                            : "bg-surface-input-light border-gray-200 text-gray-900"
                                    } ${otpErrors.otp ? "border-red-500" : ""}`}
                                />
                            ))}
                        </div>

                        {otpErrors.otp && (
                            <p className="text-red-500 text-xs text-center">{otpErrors.otp.message}</p>
                        )}

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full h-11 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white text-sm font-medium rounded-xl shadow-lg shadow-chatriv-purple/25 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2 h-4 w-4" /> Verifying...
                                </>
                            ) : (
                                "Verify & Continue"
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={handleBack}
                            className={`w-full h-10 rounded-xl text-xs font-medium transition-colors flex items-center justify-center gap-1.5 ${
                                isDark ? "text-gray-400 hover:text-gray-200 hover:bg-white/5" : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                            }`}
                        >
                            <FaArrowLeft className="h-3 w-3" />
                            Wrong number or email? Go back
                        </button>
                    </form>
                )}

                {step === 3 && (
                    <form onSubmit={handleProfileSubmit(onProfileSubmit)} className="space-y-4">
                        <div className="flex flex-col items-center">
                            {/* Profile Picture Upload Preview */}
                            <div className="relative w-20 h-20 mb-3">
                                <img
                                    src={profilePicture || selectedAvatar}
                                    alt="profile"
                                    className="w-full h-full rounded-full object-cover border-2 border-chatriv-purple/40"
                                />
                                <label
                                    htmlFor="profile-picture"
                                    className="absolute bottom-0 right-0 bg-chatriv-purple text-white p-1.5 rounded-full cursor-pointer hover:bg-chatriv-purple-dark shadow-soft transition-transform hover:scale-110"
                                >
                                    <FaPlus className="w-3 h-3" />
                                </label>
                                <input
                                    type="file"
                                    id="profile-picture"
                                    accept="image/*"
                                    onChange={handleFileChange}
                                    className="hidden"
                                />
                            </div>

                            <p className={`text-xs ${isDark ? "text-gray-400" : "text-gray-500"} mb-2`}>
                                Or choose an avatar
                            </p>

                            <div className="flex flex-wrap justify-center gap-2 mb-3">
                                {avatars.map((avatar, index) => (
                                    <img
                                        key={index}
                                        src={avatar}
                                        alt={`Avatar ${index + 1}`}
                                        className={`w-10 h-10 rounded-full cursor-pointer transition-all hover:scale-105 ${
                                            selectedAvatar === avatar && !profilePictureFile
                                                ? "ring-2 ring-chatriv-purple ring-offset-2 dark:ring-offset-[#1A1D23]"
                                                : "opacity-70 hover:opacity-100"
                                        }`}
                                        onClick={() => {
                                            setSelectedAvatar(avatar);
                                            setProfilePicture(null);
                                            setProfilePictureFile(null);
                                        }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className={`block text-xs font-medium mb-1.5 ${isDark ? "text-gray-300" : "text-gray-700"}`}>
                                Username
                            </label>
                            <div className="relative">
                                <FaUser className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 ${isDark ? "text-gray-500" : "text-gray-400"}`} />
                                <input
                                    type="text"
                                    {...profileRegister("username")}
                                    placeholder="Your username"
                                    className={`w-full h-11 pl-10 pr-3.5 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-chatriv-purple/40 transition-shadow ${
                                        isDark
                                            ? "bg-surface-input-dark border-gray-800 text-white placeholder-gray-500"
                                            : "bg-surface-input-light border-gray-200 text-gray-900 placeholder-gray-400"
                                    } ${profileErrors.username ? "border-red-500" : ""}`}
                                />
                            </div>
                            {profileErrors.username && (
                                <p className="text-red-500 text-xs mt-1">{profileErrors.username.message}</p>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <input
                                type="checkbox"
                                id="terms"
                                {...profileRegister("agreed")}
                                className="rounded text-chatriv-purple focus:ring-chatriv-purple/40 cursor-pointer"
                            />
                            <label
                                htmlFor="terms"
                                className={`text-xs cursor-pointer ${isDark ? "text-gray-300" : "text-gray-600"}`}
                            >
                                I agree to the{" "}
                                <span className="text-chatriv-purple hover:underline">
                                    Terms & Conditions
                                </span>
                            </label>
                        </div>
                        {profileErrors.agreed && (
                            <p className="text-red-500 text-xs">{profileErrors.agreed.message}</p>
                        )}

                        <button
                            type="submit"
                            disabled={!watch("agreed") || loading}
                            className="w-full h-11 bg-chatriv-purple hover:bg-chatriv-purple-dark text-white text-sm font-medium rounded-xl shadow-lg shadow-chatriv-purple/25 transition-all flex items-center justify-center disabled:opacity-50"
                        >
                            {loading ? (
                                <>
                                    <FaSpinner className="animate-spin mr-2 h-4 w-4" /> Creating Profile...
                                </>
                            ) : (
                                "Complete Profile"
                            )}
                        </button>
                    </form>
                )}
            </motion.div>
        </div>
    )
}

