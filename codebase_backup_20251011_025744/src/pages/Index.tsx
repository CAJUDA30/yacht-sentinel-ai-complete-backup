import YachtDashboard from "@/components/YachtDashboard";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

const Index = () => {
  return (
    <ProtectedRoute>
      <YachtDashboard />
    </ProtectedRoute>
  );
};

export default Index;
