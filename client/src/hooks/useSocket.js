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

    socket.current.on('connect', () => {
      console.log('Socket connected:', socket.current.id);
      // tell server this user is online
      socket.current.emit('userOnline', { userId: user._id });
    });

    return () => {
      socket.current?.emit('userOffline', { userId: user._id });
      socket.current?.disconnect();
    };
  }, [user]);

  const joinGroup = (groupId) => {
    socket.current?.emit('joinGroup', { groupId, userId: user?._id });
  };

  const sendMessage = (groupId, content) => {
    socket.current?.emit('sendMessage', { groupId, senderId: user?._id, content });
  };

  const onMessage = (callback) => {
    socket.current?.on('newMessage', callback);
    return () => socket.current?.off('newMessage', callback);
  };

  const onTyping = (callback) => {
    socket.current?.on('userTyping', callback);
    return () => socket.current?.off('userTyping', callback);
  };

  const onStopTyping = (callback) => {
    socket.current?.on('userStoppedTyping', callback);
    return () => socket.current?.off('userStoppedTyping', callback);
  };

  const onOnlineUsers = (callback) => {
    socket.current?.on('onlineUsers', callback);
    return () => socket.current?.off('onlineUsers', callback);
  };

  const emitTyping = (groupId) => {
    socket.current?.emit('typing', { groupId, username: user?.username });
  };

  const emitStopTyping = (groupId) => {
    socket.current?.emit('stopTyping', { groupId });
  };

  return {
    joinGroup,
    sendMessage,
    onMessage,
    onTyping,
    onStopTyping,
    onOnlineUsers,
    emitTyping,
    emitStopTyping,
  };
};

export default useSocket;