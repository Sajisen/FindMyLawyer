import { Navigate, Route, Routes } from "react-router-dom";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";
import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import FindLawyersPage from "./pages/FindLawyersPage.jsx";
import LawyerProfilePage from "./pages/LawyerProfilePage.jsx";
import SavedLawyersPage from "./pages/SavedLawyersPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import ForgotPasswordPage from "./pages/ForgotPasswordPage.jsx";
import AccountSecurityPage from "./pages/AccountSecurityPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RegisterLawyerPage from "./pages/RegisterLawyerPage.jsx";
import ProfilePage from "./pages/ProfilePage.jsx";
import NotFoundPage from "./pages/NotFoundPage.jsx";
import EditLawyerProfilePage from "./pages/lawyer/EditLawyerProfilePage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";

import LawyerVerificationPage from "./pages/lawyer/LawyerVerificationPage.jsx";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/find-lawyers" element={<FindLawyersPage />} />
        <Route path="/lawyers/:id" element={<LawyerProfilePage />} />
        <Route path="/saved-lawyers" element={<SavedLawyersPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/register-lawyer" element={<RegisterLawyerPage />} />

        <Route
          path="/account-security"
          element={
            <ProtectedRoute roles={["client", "lawyer", "admin"]}>
              <AccountSecurityPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute roles={["client", "lawyer", "admin"]}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile/edit"
          element={
            <ProtectedRoute roles={["lawyer"]}>
              <EditLawyerProfilePage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lawyer"
          element={
            <ProtectedRoute roles={["lawyer"]}>
              <Navigate to="/profile" replace />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lawyer/edit-profile"
          element={
            <ProtectedRoute roles={["lawyer"]}>
              <Navigate to="/profile/edit" replace />
            </ProtectedRoute>
          }
        />

        <Route path="/lawyer/verification" element={<ProtectedRoute roles={["lawyer"]}><LawyerVerificationPage /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute roles={["admin"]}>
              <AdminDashboardPage />
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>

      <Footer />
    </>
  );
}

export default App;
