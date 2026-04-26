import { useContext } from "react";
import { AuthContext } from "../App";

export default function InvestorDashboard() {
  const { user } = useContext(AuthContext);

  return (
    <div className="p-8">
      <h1 className="font-heading text-3xl font-semibold mb-2">Investor Dashboard</h1>
      <p className="text-muted-foreground">Welcome back, {user?.name}. Your investor tools are coming soon.</p>
    </div>
  );
}
