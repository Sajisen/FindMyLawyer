import { Route, Routes } from "react-router-dom";

import Navbar from "./components/layout/Navbar.jsx";
import Footer from "./components/layout/Footer.jsx";

import HomePage from "./pages/HomePage.jsx";
import FindLawyersPage from "./pages/FindLawyersPage.jsx";
import RegisterLawyerPage from "./pages/RegisterLawyerPage.jsx";

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
          path="/register-lawyer"
          element={<RegisterLawyerPage />}
        />
      </Routes>

      <Footer />
    </>
  );
}

export default App;