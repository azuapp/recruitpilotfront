import { useEffect, useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { useToast } from "@/hooks/use-toast";
import { isUnauthorizedError } from "@/lib/authUtils";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Sidebar from "@/components/sidebar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { UserPlus, Edit, Trash2, Loader2, User, Calendar, Shield } from "lucide-react";
import { cn } from "@/lib/utils";

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  role?: string;
  isActive?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export default function Users() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { t, isRTL } = useLanguage();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  
  const [userForm, setUserForm] = useState({
    email: "",
    firstName: "",
    lastName: "",
    password: "",
    role: "admin"
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/auth";
      }, 500);
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
    retry: false,
  });

  const createUserMutation = useMutation({
    mutationFn: async (data: typeof userForm) => {
      console.log("Creating user with data:", data);
      const res = await apiRequest("POST", "/api/users", data);
      console.log("Response status:", res.status);
      console.log("Response headers:", res.headers);
      
      const text = await res.text();
      console.log("Raw response text:", text);
      
      try {
        const result = JSON.parse(text);
        console.log("Parsed user creation result:", result);
        return result;
      } catch (e) {
        console.error("JSON parse error:", e);
        console.error("Failed to parse response:", text);
        throw new Error(`Invalid JSON response: ${text}`);
      }
    },
    onSuccess: (data) => {
      console.log("User creation success, invalidating cache and closing dialog");
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: "User Created",
        description: "User created successfully",
      });
    },
    onError: (error: Error) => {
      console.error("User creation error:", error);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to create user",
        variant: "destructive",
      });
    },
  });

  const updateUserMutation = useMutation({
    mutationFn: async (data: Partial<typeof userForm> & { id: string }) => {
      const res = await apiRequest("PUT", `/api/users/${data.id}`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      setIsEditDialogOpen(false);
      setEditingUser(null);
      resetForm();
      toast({
        title: "User Updated",
        description: "User updated successfully",
      });
    },
    onError: (error: Error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to update user",
        variant: "destructive",
      });
    },
  });

  const deleteUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      const response = await apiRequest("DELETE", `/api/users/${userId}`);
      return response.json();
    },
    onMutate: async (userId: string) => {
      setDeletingUserId(userId);
    },
    onSuccess: () => {
      setDeletingUserId(null);
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      toast({
        title: "User Deleted",
        description: "User deleted successfully",
      });
    },
    onError: (error: any) => {
      setDeletingUserId(null);
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/auth";
        }, 500);
        return;
      }
      toast({
        title: "Error",
        description: error.message || "Failed to delete user",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setUserForm({
      email: "",
      firstName: "",
      lastName: "",
      password: "",
      role: "admin"
    });
  };

  const handleCreateUser = () => {
    console.log("Handle create user called with form:", userForm);
    if (!userForm.email || !userForm.password || !userForm.firstName || !userForm.lastName) {
      toast({
        title: "Error",
        description: "All fields are required",
        variant: "destructive",
      });
      return;
    }
    console.log("Form validation passed, calling mutation");
    createUserMutation.mutate(userForm);
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setUserForm({
      email: user.email,
      firstName: user.firstName || "",
      lastName: user.lastName || "",
      password: "", // Don't pre-fill password for security
      role: "admin" // Default role, could be extended
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateUser = () => {
    if (!editingUser || !userForm.email) {
      toast({
        title: "Error",
        description: "Email is required",
        variant: "destructive",
      });
      return;
    }
    
    // Remove password from update if empty
    const updateData: any = { ...userForm, id: editingUser.id };
    if (!updateData.password) {
      delete updateData.password;
    }
    
    updateUserMutation.mutate(updateData);
  };

  const handleDeleteUser = (user: User) => {
    if (!confirm(`Are you sure you want to delete user "${user.email}"?`)) return;
    deleteUserMutation.mutate(user.id);
  };

  const getInitials = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.firstName) {
      return user.firstName[0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  };

  const getFullName = (user: User) => {
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) {
      return user.firstName;
    }
    return user.email;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-screen bg-gray-50", isRTL ? "flex-row-reverse" : "flex-row")}>
      <Sidebar />
      
      <main className={cn(
        "flex-1 min-w-0 transition-all duration-200",
        isRTL ? "lg:mr-64" : "lg:ml-64"
      )}>
        <div className="p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-lg sm:text-2xl font-bold text-gray-900 dark:text-white">
                {t("users")}
              </h1>
              <p className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
                Manage system users and administrators
              </p>
            </div>
            <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="text-xs sm:text-sm">
                  <UserPlus className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                  Add User
                </Button>
              </DialogTrigger>
              <DialogContent className="w-[95vw] max-w-md mx-auto">
                <DialogHeader>
                  <DialogTitle className="text-sm sm:text-base">Create New User</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label className="text-sm">Email *</Label>
                    <Input
                      type="email"
                      placeholder="user@example.com"
                      value={userForm.email}
                      onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-sm">First Name *</Label>
                      <Input
                        placeholder="John"
                        value={userForm.firstName}
                        onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                    <div>
                      <Label className="text-sm">Last Name *</Label>
                      <Input
                        placeholder="Doe"
                        value={userForm.lastName}
                        onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                        className="mt-2"
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-sm">Password *</Label>
                    <Input
                      type="password"
                      placeholder="••••••••"
                      value={userForm.password}
                      onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                      className="mt-2"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">Role</Label>
                    <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                      <SelectTrigger className="mt-2">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Administrator</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" size="sm" onClick={() => setIsCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleCreateUser} disabled={createUserMutation.isPending}>
                      {createUserMutation.isPending ? (
                        <Loader2 className="w-3 h-3 animate-spin mr-1" />
                      ) : (
                        <UserPlus className="w-3 h-3 mr-1" />
                      )}
                      Create User
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Users List */}
          {usersLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-gray-500" />
              <div className="text-gray-500 mt-2">Loading users...</div>
            </div>
          ) : !users || users.length === 0 ? (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <User className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-base sm:text-lg font-medium text-gray-900 mb-2">No users found</h3>
                <p className="text-sm sm:text-base text-gray-500 mb-4">
                  Create your first user to get started with the system.
                </p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3 sm:space-y-4">
              {users.map((user) => (
                <Card key={user.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex flex-col space-y-3">
                      {/* Header Row */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 flex-1 min-w-0">
                          {user.profileImageUrl ? (
                            <img 
                              src={user.profileImageUrl} 
                              alt={getFullName(user)}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover flex-shrink-0"
                            />
                          ) : (
                            <Avatar className="w-10 h-10 sm:w-12 sm:h-12 flex-shrink-0">
                              <AvatarFallback className="text-sm sm:text-base">
                                {getInitials(user)}
                              </AvatarFallback>
                            </Avatar>
                          )}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm sm:text-base font-medium text-gray-900 truncate">
                              {getFullName(user)}
                            </h3>
                            <p className="text-xs sm:text-sm text-gray-500 truncate">
                              {user.email}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2 flex-shrink-0">
                          <Badge variant="secondary" className="text-xs">
                            <Shield className="w-3 h-3 mr-1" />
                            Admin
                          </Badge>
                        </div>
                      </div>

                      {/* User Details */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs sm:text-sm">
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-gray-600">
                            Created: {new Date(user.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {user.updatedAt && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="w-3 h-3 text-gray-500" />
                            <span className="text-gray-600">
                              Updated: {new Date(user.updatedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleEditUser(user)}
                          className="flex items-center space-x-1 text-xs px-3 py-2 h-8"
                        >
                          <Edit className="w-3 h-3" />
                          <span>Edit</span>
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleDeleteUser(user)}
                          className="flex items-center space-x-1 text-xs px-3 py-2 h-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                          disabled={deletingUserId === user.id}
                        >
                          {deletingUserId === user.id ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Trash2 className="w-3 h-3" />
                          )}
                          <span>Delete</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Edit User Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="w-[95vw] max-w-md mx-auto">
              <DialogHeader>
                <DialogTitle className="text-sm sm:text-base">Edit User</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm">Email *</Label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm">First Name</Label>
                    <Input
                      placeholder="John"
                      value={userForm.firstName}
                      onChange={(e) => setUserForm({ ...userForm, firstName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label className="text-sm">Last Name</Label>
                    <Input
                      placeholder="Doe"
                      value={userForm.lastName}
                      onChange={(e) => setUserForm({ ...userForm, lastName: e.target.value })}
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label className="text-sm">New Password</Label>
                  <Input
                    type="password"
                    placeholder="Leave empty to keep current password"
                    value={userForm.password}
                    onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label className="text-sm">Role</Label>
                  <Select value={userForm.role} onValueChange={(value) => setUserForm({ ...userForm, role: value })}>
                    <SelectTrigger className="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrator</SelectItem>
                      <SelectItem value="user">User</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => setIsEditDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button size="sm" onClick={handleUpdateUser} disabled={updateUserMutation.isPending}>
                    {updateUserMutation.isPending ? (
                      <Loader2 className="w-3 h-3 animate-spin mr-1" />
                    ) : (
                      <Edit className="w-3 h-3 mr-1" />
                    )}
                    Update User
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}