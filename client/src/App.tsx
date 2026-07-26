import { Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { ProtectedRoute } from './components/ProtectedRoute';

import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Markets from './pages/Markets';
import Listings from './pages/Listings';
import ListingDetail from './pages/ListingDetail';
import CreateListing from './pages/CreateListing';
import TradeRequests from './pages/TradeRequests';
import TradeRoom from './pages/TradeRoom';
import Admin from './pages/Admin';
import NotFound from './pages/NotFound';

export default function App() {
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/markets" element={<Markets />} />
          <Route path="/listings" element={<Listings />} />
          <Route path="/listings/:id" element={<ListingDetail />} />
          <Route path="/profile/:username" element={<Profile />} />

          <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          <Route path="/listings/new" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/listings/:id/edit" element={<ProtectedRoute><CreateListing /></ProtectedRoute>} />
          <Route path="/trades/requests" element={<ProtectedRoute><TradeRequests /></ProtectedRoute>} />
          <Route path="/trades" element={<ProtectedRoute><TradeRoom /></ProtectedRoute>} />
          <Route path="/trades/:id" element={<ProtectedRoute><TradeRoom /></ProtectedRoute>} />

          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><Admin /></ProtectedRoute>} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
</arg_value>
</write_to_file></tool_call>