import React, { useEffect, useState } from "react";
import { useAuth } from "../context/AuthContext";
import {
  getAllAssignments,
  getAssignmentsByEngineer,
  createAssignment,
  updateAssignment,
  deleteAssignment,
} from "../api/assignments";
import { getAllEngineers } from "../api/engineers";
import { getAllProjects } from "../api/projects";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Briefcase,
  Calendar,
  Clock,
  User as UserIcon,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Plus,
  Edit,
  Trash2,
} from "lucide-react";

interface Assignment {
  _id: string;
  projectId: { _id: string; name: string };
  engineerId: { _id: string; name: string };
  allocationPercentage: number;
  startDate: string;
  endDate: string;
  role: string;
}

interface Engineer {
  _id: string;
  name: string;
  email: string;
  role: string;
  skills?: string[];
  seniority?: string;
  maxCapacity?: number;
  department?: string;
}

interface Project {
  _id: string;
  name: string;
  requiredSkills: string[];
  teamSize: number;
  status: string;
}

const Assignments: React.FC = () => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [engineers, setEngineers] = useState<Engineer[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Modal states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedAssignment, setSelectedAssignment] =
    useState<Assignment | null>(null);
  const [creating, setCreating] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    engineerId: "",
    projectId: "",
    allocationPercentage: 50,
    startDate: "",
    endDate: "",
    role: "Developer",
  });

  const [editForm, setEditForm] = useState({
    allocationPercentage: 50,
    startDate: "",
    endDate: "",
    role: "Developer",
  });

  // Helper function to get project name
  const getProjectName = (assignment: Assignment): string => {
    return assignment.projectId.name || "Unknown Project";
  };

  // Helper function to get engineer name
  const getEngineerName = (assignment: Assignment): string => {
    return assignment.engineerId.name || "Unknown Engineer";
  };

  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const fetchData = async () => {
      try {
        let assignmentsData;
        if (user.role === "manager") {
          assignmentsData = await getAllAssignments();
          const [engineersData, projectsData] = await Promise.all([
            getAllEngineers(),
            getAllProjects(),
          ]);
          setEngineers(engineersData);
          setProjects(projectsData);
        } else {
          assignmentsData = await getAssignmentsByEngineer(user._id);
        }
        setAssignments(assignmentsData);
      } catch {
        setError("Failed to load assignments");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleCreateFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCreateForm({ ...createForm, [e.target.name]: e.target.value });
  };

  const handleEditFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEditForm({ ...editForm, [e.target.name]: e.target.value });
  };

  const handleEngineerChange = (value: string) => {
    setCreateForm({ ...createForm, engineerId: value });
  };

  const handleProjectChange = (value: string) => {
    setCreateForm({ ...createForm, projectId: value });
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setCreating(true);
    try {
      await createAssignment({
        engineerId: { _id: createForm.engineerId, name: "" }, // Will be populated by backend
        projectId: { _id: createForm.projectId, name: "" }, // Will be populated by backend
        allocationPercentage: createForm.allocationPercentage,
        startDate: createForm.startDate,
        endDate: createForm.endDate,
        role: createForm.role,
      });
      setShowCreateModal(false);
      setCreateForm({
        engineerId: "",
        projectId: "",
        allocationPercentage: 50,
        startDate: "",
        endDate: "",
        role: "Developer",
      });
      // Refresh assignments
      const data =
        user.role === "manager"
          ? await getAllAssignments()
          : await getAssignmentsByEngineer(user._id);
      setAssignments(data);
    } catch {
      alert("Failed to create assignment");
    } finally {
      setCreating(false);
    }
  };

  const handleEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAssignment || !user) return;
    setUpdating(true);
    try {
      await updateAssignment(selectedAssignment._id, editForm);
      setShowEditModal(false);
      setSelectedAssignment(null);
      // Refresh assignments
      const data =
        user.role === "manager"
          ? await getAllAssignments()
          : await getAssignmentsByEngineer(user._id);
      setAssignments(data);
    } catch {
      alert("Failed to update assignment");
    } finally {
      setUpdating(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedAssignment || !user) return;
    setDeleting(true);
    try {
      await deleteAssignment(selectedAssignment._id);
      setShowDeleteModal(false);
      setSelectedAssignment(null);
      // Refresh assignments
      const data =
        user.role === "manager"
          ? await getAllAssignments()
          : await getAssignmentsByEngineer(user._id);
      setAssignments(data);
    } catch {
      alert("Failed to delete assignment");
    } finally {
      setDeleting(false);
    }
  };

  const openEditModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setEditForm({
      allocationPercentage: assignment.allocationPercentage,
      startDate: assignment.startDate.split("T")[0],
      endDate: assignment.endDate.split("T")[0],
      role: assignment.role,
    });
    setShowEditModal(true);
  };

  const openDeleteModal = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setShowDeleteModal(true);
  };

  if (!user) return null;

  const getStatusColor = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return "bg-gray-100 text-gray-800";
    if (end.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000)
      return "bg-yellow-100 text-yellow-800 hover:bg-yello-700 hover:text-white";
    return "bg-green-100 text-green-800 hover:bg-green-700 hover:text-white";
  };

  const getStatusText = (endDate: string) => {
    const end = new Date(endDate);
    const now = new Date();
    if (end < now) return "Completed";
    if (end.getTime() - now.getTime() < 7 * 24 * 60 * 60 * 1000)
      return "Ending Soon";
    return "Active";
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading assignments...</p>
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

      <div className="flex flex-wrap items-center justify-between space-y-5">
        {/* Assignments Title */}

        <div>
          <h1 className="text-3xl font-bold text-gray-900">Assignments</h1>
          <p className="text-gray-600 mt-1">
            {user.role === "manager"
              ? "All team assignments"
              : "Your current assignments"}
          </p>
          <Badge variant="outline">
            {assignments.length} assignment{assignments.length !== 1 ? "s" : ""}
          </Badge>
        </div>

        {/* New Assignment Modal */}

        <div className="flex items-center space-x-2">
          {user.role === "manager" && (
            <Dialog open={showCreateModal} onOpenChange={setShowCreateModal}>
              <DialogTrigger asChild>
                <Button onClick={() => setShowCreateModal(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  New Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>New Assignment</DialogTitle>
                </DialogHeader>
                <form className="space-y-4" onSubmit={handleCreate}>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Engineer</label>
                    <Select
                      value={createForm.engineerId}
                      onValueChange={handleEngineerChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select engineer" />
                      </SelectTrigger>
                      <SelectContent>
                        {engineers.map((engineer) => (
                          <SelectItem key={engineer._id} value={engineer._id}>
                            {engineer.name} ({engineer.seniority})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Project</label>
                    <Select
                      value={createForm.projectId}
                      onValueChange={handleProjectChange}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select project" />
                      </SelectTrigger>
                      <SelectContent>
                        {projects.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.name} ({project.status})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Role</label>
                    <Input
                      name="role"
                      placeholder="Developer, Tech Lead, etc."
                      value={createForm.role}
                      onChange={handleCreateFormChange}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">
                      Allocation Percentage
                    </label>
                    <Input
                      name="allocationPercentage"
                      type="number"
                      min={1}
                      max={100}
                      value={createForm.allocationPercentage}
                      onChange={handleCreateFormChange}
                      required
                    />
                  </div>
                  <div className="flex gap-2">
                    <div className="space-y-2 flex-1">
                      <label className="text-sm font-medium">Start Date</label>
                      <Input
                        name="startDate"
                        type="date"
                        value={createForm.startDate}
                        onChange={handleCreateFormChange}
                        required
                      />
                    </div>
                    <div className="space-y-2 flex-1">
                      <label className="text-sm font-medium">End Date</label>
                      <Input
                        name="endDate"
                        type="date"
                        value={createForm.endDate}
                        onChange={handleCreateFormChange}
                        required
                      />
                    </div>
                  </div>
                  <Button type="submit" disabled={creating} className="w-full">
                    {creating ? "Creating..." : "Create Assignment"}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      {/* Assignments Grid */}

      {assignments.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No assignments found</h3>
            <p className="text-gray-600">
              {user.role === "manager"
                ? "No assignments have been created yet."
                : "You have no current assignments."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {assignments.map((assignment) => (
            <Card
              key={assignment._id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Briefcase className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {getProjectName(assignment)}
                      </CardTitle>
                      <CardDescription>
                        {assignment.role || "Developer"}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge className={getStatusColor(assignment.endDate)}>
                    {getStatusText(assignment.endDate)}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Allocation */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">Allocation</span>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-blue-600">
                      {assignment.allocationPercentage}%
                    </div>
                  </div>
                </div>

                {/* Engineer (for managers) */}
                {user.role === "manager" && assignment.engineerId && (
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <UserIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Engineer</span>
                    </div>
                    <span className="text-sm font-medium">
                      {getEngineerName(assignment)}
                    </span>
                  </div>
                )}

                {/* Timeline */}
                <div className="space-y-2">
                  {/* Start Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">Start Date</span>
                    </div>
                    <span className="text-sm font-medium">
                      {assignment.startDate
                        ? new Date(assignment.startDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>

                  {/* End Date */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">End Date</span>
                    </div>
                    <span className="text-sm font-medium">
                      {assignment.endDate
                        ? new Date(assignment.endDate).toLocaleDateString()
                        : "N/A"}
                    </span>
                  </div>
                </div>

                {/* Duration */}
                {assignment.startDate && assignment.endDate && (
                  <div className="pt-2 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Duration</span>
                      <span className="font-medium">
                        {Math.ceil(
                          (new Date(assignment.endDate).getTime() -
                            new Date(assignment.startDate).getTime()) /
                            (1000 * 60 * 60 * 24)
                        )}{" "}
                        days
                      </span>
                    </div>
                  </div>
                )}

                {/* Action Buttons (for managers) */}
                {user.role === "manager" && (
                  <div className="flex gap-2 pt-2 border-t">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openEditModal(assignment)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => openDeleteModal(assignment)}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Delete
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Edit Assignment Modal */}
      <Dialog open={showEditModal} onOpenChange={setShowEditModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Assignment</DialogTitle>
          </DialogHeader>
          <form className="space-y-4" onSubmit={handleEdit}>
            <div className="space-y-2">
              <label className="text-sm font-medium">Role</label>
              <Input
                name="role"
                placeholder="Developer, Tech Lead, etc."
                value={editForm.role}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Allocation Percentage
              </label>
              <Input
                name="allocationPercentage"
                type="number"
                min={1}
                max={100}
                value={editForm.allocationPercentage}
                onChange={handleEditFormChange}
                required
              />
            </div>
            <div className="flex gap-2">
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">Start Date</label>
                <Input
                  name="startDate"
                  type="date"
                  value={editForm.startDate}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
              <div className="space-y-2 flex-1">
                <label className="text-sm font-medium">End Date</label>
                <Input
                  name="endDate"
                  type="date"
                  value={editForm.endDate}
                  onChange={handleEditFormChange}
                  required
                />
              </div>
            </div>
            <Button type="submit" disabled={updating} className="w-full">
              {updating ? "Updating..." : "Update Assignment"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Assignment Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Assignment</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete this assignment? This action
              cannot be undone.
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={deleting}
                className="flex-1"
              >
                {deleting ? "Deleting..." : "Delete"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Assignments;
