import { useEffect, useRef } from 'react';
import { io } from 'socket.io-client';
import useAuthStore from '../store/authStore.js';

const useSocket = () => {
  const socket = useRef(null);
  const { user } = useAuthStore();

  useEffect(() => {
    if (!user) return;

    socket.current = io('http://localhost:5000', {
      withCredentials: true,
    });

    return () => {
      socket.current?.disconnect();
    };
  }, [user]);

  const joinGroup = (groupId) => {
    socket.current?.emit('joinGroup', {
      groupId,
      userId: user?._id,
    });
  };

  const sendMessage = (groupId, content) => {
    socket.current?.emit('sendMessage', {
      groupId,
      senderId: user?._id,
      content,
    });
  };

  const onMessage = (callback) => {
    socket.current?.on('newMessage', callback);
    return () => socket.current?.off('newMessage', callback);
  };

  const emitTyping = (groupId) => {
    socket.current?.emit('typing', { groupId, username: user?.username });
  };

  const emitStopTyping = (groupId) => {
    socket.current?.emit('stopTyping', { groupId });
  };

  return { joinGroup, sendMessage, onMessage, emitTyping, emitStopTyping };
};

export default useSocket;