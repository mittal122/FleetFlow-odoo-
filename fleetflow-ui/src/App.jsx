import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./components/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";
import Dashboard from "./pages/Dashboard";
import Vehicles from "./pages/Vehicles";
import Drivers from "./pages/Drivers";
import Dispatch from "./pages/Dispatch";
import Trips from "./pages/Trips";
import Maintenance from "./pages/Maintenance";
import Expenses from "./pages/Expenses";
import Analytics from "./pages/Analytics";
import Login from "./pages/Login";
import Layout from "./layout/Layout";
import "./App.css";


function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" />;
  return children;
}


function AppLayout() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  return (
    <Layout>
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/vehicles" element={<ProtectedRoute><Vehicles /></ProtectedRoute>} />
          <Route path="/drivers" element={<ProtectedRoute><Drivers /></ProtectedRoute>} />
          <Route path="/dispatch" element={<ProtectedRoute><Dispatch /></ProtectedRoute>} />
          <Route path="/trips" element={<ProtectedRoute><Trips /></ProtectedRoute>} />
          <Route path="/maintenance" element={<ProtectedRoute><Maintenance /></ProtectedRoute>} />
          <Route path="/expenses" element={<ProtectedRoute><Expenses /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </ErrorBoundary>
    </Layout>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppLayout />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
