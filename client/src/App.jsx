import {
  Route,
  Routes,
} from "react-router-dom";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";

import ProtectedRoute from "./components/auth/ProtectedRoute.jsx";

import HomePage from "./pages/HomePage.jsx";
import FindLawyersPage from "./pages/FindLawyersPage.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import RegisterLawyerPage from "./pages/RegisterLawyerPage.jsx";

import LawyerDashboardPage from "./pages/lawyer/LawyerDashboardPage.jsx";
import EditLawyerProfilePage from "./pages/lawyer/EditLawyerProfilePage.jsx";
import AdminDashboardPage from "./pages/admin/AdminDashboardPage.jsx";

function App() {
  return (
    <>
      <Navbar />

      <Routes>
        <Route
          path="/"
          element={<HomePage />}
        />

        <Route
          path="/find-lawyers"
          element={<FindLawyersPage />}
        />

        <Route
          path="/login"
          element={<LoginPage />}
        />

        <Route
          path="/register"
          element={<RegisterPage />}
        />

        <Route
          path="/register-lawyer"
          element={<RegisterLawyerPage />}
        />

        <Route
          path="/lawyer"
          element={
            <ProtectedRoute roles={["lawyer"]}>
              <LawyerDashboardPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/lawyer/edit-profile"
          element={
            <ProtectedRoute roles={["lawyer"]}>
              <EditLawyerProfilePage />
            </ProtectedRoute>
          }
        />
      
      <Route
  path="/admin"
  element={
    <ProtectedRoute roles={["admin"]}>
      <AdminDashboardPage />
    </ProtectedRoute>
  }
/>



      </Routes>

      <Footer />
    </>
  );
}

export default App;