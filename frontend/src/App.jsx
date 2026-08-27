import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard'; // Import your new Dashboard!

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Register />} /> {/* Or wherever your home is */}
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route path="/dashboard" element={<Dashboard />} /> {/* Add this line! */}
      </Routes>
    </Router>
  );
}

export default App;