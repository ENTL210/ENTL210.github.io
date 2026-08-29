import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import ComingSoon from "./pages/ComingSoon";
import EdTools from "./pages/EdTools";
import BanhMiHistory from "./pages/BanhMiHistory";

const HIDDEN_ROUTE = import.meta.env.VITE_HIDDEN_ROUTE || "/ed-tools";
const HUM100_ROUTE =
  import.meta.env.VITE_HUM100_ROUTE || "/ed-projects/HUM100-Final";
const BASENAME = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function App() {
  return (
    <BrowserRouter basename={BASENAME || undefined}>
      <Routes>
        <Route path="/" element={<ComingSoon />} />
        <Route path={HIDDEN_ROUTE} element={<EdTools />} />
        <Route path={HUM100_ROUTE} element={<BanhMiHistory />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
