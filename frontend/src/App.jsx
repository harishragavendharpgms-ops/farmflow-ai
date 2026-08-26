import { Routes, Route } from 'react-router-dom';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Scheduling from './pages/Scheduling';
import Profile from './pages/Profile';

function App() {
  return (
    // We only need Routes and Route here now!
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/scheduling" element={<Scheduling />} />
      <Route path="/profile" element={<Profile />} />
    </Routes>
  );
}

export default App;