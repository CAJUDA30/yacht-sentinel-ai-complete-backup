import { FC } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";

const DEPARTMENTS = [
  "All",
  "Engineering",
  "Operations",
  "Finance",
  "Security",
  "Marketing",
  "HR",
  "Sales",
  "Compliance",
  "General",
] as const;

const DepartmentQuickCards: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const go = (dept: string) => {
    const next = new URLSearchParams(searchParams);
    next.set("tab", "logs");
    next.set("dept", dept);
    setSearchParams(next);
    navigate(`/superadmin?${next.toString()}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Quick Departments</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-wrap gap-2">
        {DEPARTMENTS.map((d) => (
          <Button key={d} variant="outline" size="sm" onClick={() => go(d)}>
            {d}
          </Button>
        ))}
      </CardContent>
    </Card>
  );
};

export default DepartmentQuickCards;
