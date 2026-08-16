import React, { useEffect, useState } from 'react'
import Layout from './Layout'
import { motion } from 'framer-motion'
import ChatList from '../pages/chatSection/ChatList'
import { getAllUsers } from '../services/user.service';

export default function Home() {
  const [allUsers, setAllusers] = useState([]);
  const getAllUser = async () => {
    try {
      const result = await getAllUsers();
      if (result?.success) {
        setAllusers(result.data)
      }
    } catch (error) {
      console.log(error);
    }
  }
  useEffect(() => {
    getAllUser();
  },[]);

  return (
    <Layout>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className='h-full'
      >
        <ChatList contacts={allUsers}/>
      </motion.div>
    </Layout>
  )
}
