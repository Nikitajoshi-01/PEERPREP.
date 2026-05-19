import { Navigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore.js';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, token } = useAuthStore();

  // if token exists, allow through — App.jsx will fetch the user
  if (token) return children;

  // no token at all — redirect to login
  if (!isAuthenticated) return <Navigate to="/login" replace />;

  return children;
};

export default ProtectedRoute;