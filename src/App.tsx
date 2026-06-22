import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import KOLList from "@/pages/KOLList";
import KOLDetail from "@/pages/KOLDetail";
import ScheduleList from "@/pages/ScheduleList";
import ScheduleCreate from "@/pages/ScheduleCreate";
import VerificationList from "@/pages/VerificationList";
import VerificationImport from "@/pages/VerificationImport";
import MatchingList from "@/pages/MatchingList";
import CommissionList from "@/pages/CommissionList";
import CommissionDetail from "@/pages/CommissionDetail";
import FinanceList from "@/pages/FinanceList";
import Statement from "@/pages/Statement";
import ROIReport from "@/pages/ROIReport";

export default function App() {
  return (
    <Router>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/kol" element={<KOLList />} />
          <Route path="/kol/:id" element={<KOLDetail />} />
          <Route path="/schedule" element={<ScheduleList />} />
          <Route path="/schedule/create" element={<ScheduleCreate />} />
          <Route path="/verification" element={<VerificationList />} />
          <Route path="/verification/import" element={<VerificationImport />} />
          <Route path="/matching" element={<MatchingList />} />
          <Route path="/commission" element={<CommissionList />} />
          <Route path="/commission/:id" element={<CommissionDetail />} />
          <Route path="/finance" element={<FinanceList />} />
          <Route path="/statement/single/:commissionId" element={<Statement />} />
          <Route path="/statement/:kolId" element={<Statement />} />
          <Route path="/roi" element={<ROIReport />} />
        </Route>
      </Routes>
    </Router>
  );
}
