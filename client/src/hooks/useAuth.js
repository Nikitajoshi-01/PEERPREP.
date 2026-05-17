import { useNavigate } from 'react-router-dom';
import api from '../api/axios.js';
import useAuthStore from '../store/authStore.js';
import toast from 'react-hot-toast';

const useAuth = () => {
  const navigate = useNavigate();
  const { setUser, setToken, logout: clearAuth } = useAuthStore();

  const register = async (formData) => {
    try {
      const res = await api.post('/auth/register', formData);
      toast.success('Account created! Please login.');
      navigate('/login');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Registration failed');
    }
  };

  const login = async (data) => {
    try {
      const res = await api.post('/auth/login', data);
      setToken(res.data.data.accessToken);
      setUser(res.data.data.user);
      toast.success('Welcome back!');
      navigate('/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Login failed');
    }
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      clearAuth();
      navigate('/login');
    }
  };

  const getCurrentUser = async () => {
    try {
      const res = await api.get('/auth/current-user');
      setUser(res.data.data);
    } catch (err) {
      clearAuth();
    }
  };

  return { register, login, logout, getCurrentUser };
};

export default useAuth;