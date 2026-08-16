// import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Login from './pages/user-login/Login';
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import { ProtectedRoute, PublicRoute } from './protected';
import Home from './components/Home';
import UserDetails from './components/UserDetails';
import Status from './pages/statusSection/Status';
import Setting from './pages/settingSection/Setting';
import useUserStore from './store/useUserStore';
import { useEffect } from 'react';
import { disconnectSocket, initializeSocket } from './services/chat.service';
import { useChatStore } from './store/chatStore';


function App() {
  const { user } = useUserStore();
  const { setCurrentUser, initSocketListners, cleanup } = useChatStore();

  useEffect(() => {
    if (user?._id) {
      const socket = initializeSocket();
      
      if (socket) {
        setCurrentUser(user);
        initSocketListners();
      }
    }

    return () => {
      cleanup();
      disconnectSocket();
    }
  }, [user, setCurrentUser, initSocketListners, cleanup]);

  return (
    <>
      <ToastContainer position='top-right' autoClose={3000} />
      <Router>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route path='/user-login' element={<Login />} />
          </Route>
          <Route element={<ProtectedRoute />}>
            <Route path='/' element={<Home />} />
            <Route path='/user-profile' element={<UserDetails />} />
            <Route path='/status' element={<Status />} />
            <Route path='/setting' element={<Setting />} />
          </Route>
        </Routes>
      </Router>
    </>
  );
}

export default App;
