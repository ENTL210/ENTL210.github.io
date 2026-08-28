import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ComingSoon from "./pages/ComingSoon";
import EdTools from "./pages/EdTools";

const HIDDEN_ROUTE = import.meta.env.VITE_HIDDEN_ROUTE || "/ed-9k2vqx7m";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<ComingSoon />} />
        <Route path={HIDDEN_ROUTE} element={<EdTools />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
