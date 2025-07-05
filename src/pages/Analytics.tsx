import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { getAllEngineers } from "../api/engineers";
import { getAllProjects } from "../api/projects";
import { getAllAssignments } from "../api/assignments";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Users,
  Briefcase,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Activity,
} from "lucide-react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from "chart.js";
import { Bar, Pie } from "react-chartjs-2";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

interface Engineer {
  _id: string;
  name: string;
  email: string;
  skills: string[];
  seniority: string;
  maxCapacity: number;
  currentCapacity: number;
  availableCapacity: number;
}

interface Project {
  _id: string;
  name: string;
  status: string;
  teamSize: number;
  requiredSkills: string[];
}

interface Assignment {
  _id: string;
  engineerId: {
    _id: string;
    name: string;
    email?: string;
    seniority?: string;
    department?: string;
  };
  projectId: {
    _id: string;
    name: string;
    status?: string;
    requiredSkills?: string[];
    teamSize?: number;
  };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

type EngineerWithCapacity = Engineer & {
  maxCapacity: number;
  skills: string[];
  seniority: string;
  currentCapacity: number;
  availableCapacity: number;
};

type EngineerWithSkills = {
  skills?: string[];
};

const Analytics: React.FC = () => {
  const { user } = useAuth();
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;

    // Only managers can access global analytics
    if (user.role !== "manager") {
      setError("Access denied. Managers only.");
      return;
    }

    setLoading(true);
    const fetchData = async () => {
      try {
        const [engs, projs, assigns] = await Promise.all([
          getAllEngineers(),
          getAllProjects(),
          getAllAssignments(),
        ]);

        // Calculate capacity for each engineer
        const engineersWithCapacity: EngineerWithCapacity[] = engs.map(
          (engineer) => {
            const engineerAssignments = assigns.filter(
              (a: Assignment) =>
                a.engineerId._id === engineer._id &&
                new Date(a.endDate) >= new Date()
            );

            const currentCapacity = engineerAssignments.reduce(
              (sum: number, a: Assignment) =>
                sum + (a.allocationPercentage || 0),
              0
            );

            const maxCapacity = engineer.maxCapacity ?? 100;
            const availableCapacity = Math.max(
              0,
              maxCapacity - currentCapacity
            );

            return {
              ...engineer,
              maxCapacity: maxCapacity,
              skills: engineer.skills ?? [],
              seniority: engineer.seniority ?? "",
              currentCapacity,
              availableCapacity,
            };
          }
        );

        setEngineers(engineersWithCapacity);
        setProjects(projs);
        setAssignments(assigns);
      } catch {
        setError("Failed to load analytics data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (!user) return null;

  // Check if user is not a manager
  if (user.role !== "manager") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>Access denied. Managers only.</p>
        </div>
      </div>
    );
  }

  // Analytics calculations
  const totalEngineers = engineers.length;
  const activeProjects = projects.filter((p) => p.status === "active").length;
  const totalAssignments = assignments.filter(
    (a) => new Date(a.endDate) >= new Date()
  ).length;

  const averageUtilization =
    engineers.length > 0
      ? engineers.reduce((sum, e) => sum + e.currentCapacity, 0) /
        engineers.length
      : 0;

  const overloadedEngineers = engineers.filter(
    (e) => e.currentCapacity > (e.maxCapacity || 100) * 0.9
  ).length;
  const underutilizedEngineers = engineers.filter(
    (e) => e.availableCapacity > 20
  ).length;

  const skillDemand = projects.reduce(
    (acc: Record<string, number>, project) => {
      project.requiredSkills?.forEach((skill) => {
        acc[skill] = (acc[skill] || 0) + 1;
      });
      return acc;
    },
    {}
  );

  const topSkills = Object.entries(skillDemand)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5);

  // Skill gap analysis
  const skillGapAnalysis = () => {
    // Get all skills required by projects
    const requiredSkills = new Set<string>();
    projects.forEach((project) => {
      project.requiredSkills?.forEach((skill) => requiredSkills.add(skill));
    });

    // Get all skills available in the team
    const availableSkills = new Set<string>();
    engineers.forEach((engineer) => {
      engineer.skills?.forEach((skill) => availableSkills.add(skill));
    });

    // Find missing skills
    const missingSkills = Array.from(requiredSkills).filter(
      (skill) => !availableSkills.has(skill)
    );

    // Find skills with insufficient coverage
    const skillCoverage: Record<string, number> = {};

    requiredSkills.forEach((skill) => {
      const engineersWithSkill = engineers.filter(
        (engineer: EngineerWithSkills) => engineer.skills?.includes(skill)
      );
      skillCoverage[skill] = engineersWithSkill.length;
    });

    const insufficientSkills = Object.entries(skillCoverage)
      .filter(([, count]) => count < 2) // Less than 2 engineers have this skill
      .map(([skill]) => skill);

    return {
      missingSkills,
      insufficientSkills,
      totalRequired: requiredSkills.size,
      totalAvailable: availableSkills.size,
      coverage: (availableSkills.size / requiredSkills.size) * 100,
    };
  };

  const skillGap = skillGapAnalysis();

  // Chart data
  const teamUtilizationData = {
    labels: engineers.map((e) => e.name),
    datasets: [
      {
        label: "Current Capacity (%)",
        data: engineers.map((e) => e.currentCapacity),
        backgroundColor: engineers.map((e) =>
          e.currentCapacity > 90
            ? "#f87171"
            : e.currentCapacity > 75
            ? "#fbbf24"
            : "#34d399"
        ),
        borderColor: engineers.map((e) =>
          e.currentCapacity > 90
            ? "#ef4444"
            : e.currentCapacity > 75
            ? "#f59e0b"
            : "#10b981"
        ),
        borderWidth: 1,
      },
    ],
  };

  const projectStatusData = {
    labels: ["Active", "Planning", "Completed"],
    datasets: [
      {
        data: [
          projects.filter((p) => p.status === "active").length,
          projects.filter((p) => p.status === "planning").length,
          projects.filter((p) => p.status === "completed").length,
        ],
        backgroundColor: ["#8b5cf6", "#06b6d4", "#64748b"],
        borderColor: ["#7c3aed", "#0891b2", "#475569"],
        borderWidth: 1,
      },
    ],
  };

  const skillDemandData = {
    labels: topSkills.map(([skill]) => skill),
    datasets: [
      {
        label: "Projects Requiring Skill",
        data: topSkills.map(([, count]) => count),
        backgroundColor: "#06b6d4",
        borderColor: "#0891b2",
        borderWidth: 1,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
      },
    },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center text-red-600">
          <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Team utilization and performance insights
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Badge variant="outline">
            <BarChart3 className="h-4 w-4 mr-1" />
            Real-time
          </Badge>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Team Utilization
            </CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(averageUtilization)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Average capacity usage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Overloaded Engineers
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {overloadedEngineers}
            </div>
            <p className="text-xs text-muted-foreground">&gt;90% capacity</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Available Engineers
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {underutilizedEngineers}
            </div>
            <p className="text-xs text-muted-foreground">Ready for new work</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Active Assignments
            </CardTitle>
            <Briefcase className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAssignments}</div>
            <p className="text-xs text-muted-foreground">Current workload</p>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Utilization Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Team Capacity Utilization
            </CardTitle>
            <CardDescription>
              Current capacity usage for each team member
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Bar data={teamUtilizationData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>

        {/* Project Status Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5" />
              Project Status Distribution
            </CardTitle>
            <CardDescription>
              Distribution of projects by status
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <Pie data={projectStatusData} options={chartOptions} />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Skill Demand Chart */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Top Required Skills
          </CardTitle>
          <CardDescription>
            Most in-demand skills across all projects
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <Bar data={skillDemandData} options={chartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Skill Gap Analysis
          </CardTitle>
          <CardDescription>
            Identify missing skills and team coverage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Coverage Overview */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Coverage Overview</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Required Skills:</span>
                  <span className="font-medium">{skillGap.totalRequired}</span>
                </div>
                <div className="flex justify-between">
                  <span>Available Skills:</span>
                  <span className="font-medium">{skillGap.totalAvailable}</span>
                </div>
                <div className="flex justify-between">
                  <span>Coverage:</span>
                  <span
                    className={`font-medium ${
                      skillGap.coverage >= 80
                        ? "text-green-600"
                        : skillGap.coverage >= 60
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {Math.round(skillGap.coverage)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Missing Skills */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-red-600">
                Missing Skills
              </h3>
              {skillGap.missingSkills.length === 0 ? (
                <p className="text-green-600 text-sm">
                  ✅ All required skills are available
                </p>
              ) : (
                <div className="space-y-2">
                  {skillGap.missingSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="destructive"
                      className="mr-2 mb-2"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            {/* Insufficient Coverage */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg text-yellow-600">
                Low Coverage
              </h3>
              {skillGap.insufficientSkills.length === 0 ? (
                <p className="text-green-600 text-sm">
                  ✅ Good skill distribution
                </p>
              ) : (
                <div className="space-y-2">
                  {skillGap.insufficientSkills.map((skill) => (
                    <Badge
                      key={skill}
                      variant="secondary"
                      className="mr-2 mb-2"
                    >
                      {skill}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Recommendations */}
          {(skillGap.missingSkills.length > 0 ||
            skillGap.insufficientSkills.length > 0) && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h4 className="font-semibold mb-2">Recommendations</h4>
              <ul className="space-y-1 text-sm">
                {skillGap.missingSkills.length > 0 && (
                  <li>
                    • Consider hiring engineers with:{" "}
                    {skillGap.missingSkills.join(", ")}
                  </li>
                )}
                {skillGap.insufficientSkills.length > 0 && (
                  <li>
                    • Provide training for:{" "}
                    {skillGap.insufficientSkills.join(", ")}
                  </li>
                )}
                <li>• Cross-train existing team members on critical skills</li>
                <li>• Review project requirements to optimize skill needs</li>
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Team Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Summary
          </CardTitle>
          <CardDescription>Key team statistics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Engineers</span>
              <span className="font-medium">{totalEngineers}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Active Projects</span>
              <span className="font-medium">{activeProjects}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Total Assignments</span>
              <span className="font-medium">{totalAssignments}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg. Utilization</span>
              <span className="font-medium">
                {Math.round(averageUtilization)}%
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Analytics;
