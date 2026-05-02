import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Login from "./pages/Login.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Directory from "./pages/Directory.tsx";
import Profile from "./pages/Profile.tsx";
import NewEmployee from "./pages/NewEmployee.tsx";
import Keys from "./pages/Keys.tsx";
import Layout from "./components/Layout.tsx";

function RequireAuth({ children }: { children: React.ReactNode }) {
  const key = sessionStorage.getItem("hr_admin_key");
  if (!key) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="/"
          element={
            <RequireAuth>
              <Layout />
            </RequireAuth>
          }
        >
          <Route index element={<Dashboard />} />
          <Route path="employees" element={<Directory />} />
          <Route path="employees/new" element={<NewEmployee />} />
          <Route path="employees/:uuid" element={<Profile />} />
          <Route path="keys" element={<Keys />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
