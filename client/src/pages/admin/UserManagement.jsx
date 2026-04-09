import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Search, Filter, Edit2, Trash2, CheckCircle, XCircle, 
  User, Mail, Building2, Shield, Loader2, AlertTriangle
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { getUsers, updateUser, deleteUser, activateUser } from '../../services/userService';
import toast from 'react-hot-toast';

const UserManagement = () => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: '',
    role: '',
    isActive: ''
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [editingUser, setEditingUser] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchUsers();
  }, [filters, pagination.page]);



  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params = { ...filters, page: pagination.currentPage, limit: 20 };
      Object.keys(params).forEach(key => !params[key] && delete params[key]);
      
      const response = await getUsers(params);
      
      // Handle response structure
      const usersData = response?.data?.users || response?.users || [];
      const pagData = response?.data?.pagination || response?.pagination || {
        currentPage: 1,
        totalPages: 1,
        totalItems: usersData.length
      };
      
      setUsers(usersData);
      setPagination(pagData);
    } catch (error) {
      console.error('❌ Fetch users error:', error);
      toast.error(error.response?.data?.message || 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user._id);
    setEditForm({
      name: user.name,
      email: user.email,
      role: user.role,
      organization: user.organization,
      isActive: user.isActive
    });
  };

  // ✅ FIXED: handleSave function
  const handleSave = async (id) => {
    try {
      await updateUser(id, editForm);  // ✅ Correct function name
      toast.success('User updated successfully');
      setEditingUser(null);
      setEditForm({});
      fetchUsers();
    } catch (error) {
      console.error('❌ Update user error:', error);
      const errorMsg = error.response?.data?.message || error.message || 'Failed to update user';
      toast.error(errorMsg);
    }
  };

  const handleCancel = () => {
    setEditingUser(null);
    setEditForm({});
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      if (currentStatus) {
        await deleteUser(id);
        toast.success('User deactivated');
      } else {
        await activateUser(id);
        toast.success('User activated');
      }
      fetchUsers();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to update status');
    }
  };





  const getRoleBadge = (role) => {
    const map = {
      admin: { variant: 'danger', label: 'Admin' },
      moderator: { variant: 'warning', label: 'Moderator' },
      member: { variant: 'primary', label: 'Member' }
    };
    return map[role] || map.member;
  };

  if (loading && users.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-600">{pagination.totalItems} users in system</p>
          </div>
          <Button onClick={() => navigate('/admin')}>
            ← Back to Admin
          </Button>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-4">
              <div className="flex-1 min-w-64">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={filters.search}
                    onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
                    className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
              
              <select
                value={filters.role}
                onChange={(e) => setFilters({ ...filters, role: e.target.value, page: 1 })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Roles</option>
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
                <option value="member">Member</option>
              </select>

              <select
                value={filters.isActive}
                onChange={(e) => setFilters({ ...filters, isActive: e.target.value, page: 1 })}
                className="px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Status</option>
                <option value="true">Active</option>
                <option value="false">Inactive</option>
              </select>

              <Button variant="outline" size="sm" onClick={fetchUsers}>
                <Filter className="w-4 h-4 mr-1" /> Apply
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Users List */}
        <div className="space-y-4">
          {users.map((user) => {
            const roleBadge = getRoleBadge(user.role);
            const isEditing = editingUser === user._id;

            return (
              <Card key={user._id} hover className="p-4">
                {isEditing ? (
                  // Edit Mode
                  <div className="space-y-4">
                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Name</label>
                        <input
                          type="text"
                          value={editForm.name}
                          onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Email</label>
                        <input
                          type="email"
                          value={editForm.email}
                          onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Role</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        >
                          <option value="member">Member</option>
                          <option value="moderator">Moderator</option>
                          <option value="admin">Admin</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-slate-500 mb-1">Organization</label>
                        <input
                          type="text"
                          value={editForm.organization}
                          onChange={(e) => setEditForm({ ...editForm, organization: e.target.value })}
                          className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm"
                        />
                      </div>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`active-${user._id}`}
                          checked={editForm.isActive}
                          onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                          className="rounded border-slate-300"
                        />
                        <label htmlFor={`active-${user._id}`} className="text-sm text-slate-700">
                          Active Account
                        </label>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="sm" onClick={handleCancel}>Cancel</Button>
                        <Button size="sm" onClick={() => handleSave(user._id)}>Save Changes</Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  // View Mode
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 flex-1">
                      <div className="w-10 h-10 bg-indigo-100 rounded-full flex items-center justify-center">
                        <User className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="font-semibold text-slate-900 truncate">{user.name}</h3>
                          <Badge variant={roleBadge.variant}>{roleBadge.label}</Badge>
                          {!user.isActive && <Badge variant="neutral">Inactive</Badge>}
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-slate-500">
                          <span className="flex items-center">
                            <Mail className="w-4 h-4 mr-1" />
                            {user.email}
                          </span>
                          {user.organization && (
                            <span className="flex items-center">
                              <Building2 className="w-4 h-4 mr-1" />
                              {user.organization}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleEdit(user)}
                      >
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant={user.isActive ? 'danger' : 'success'}
                        size="sm"
                        onClick={() => handleToggleActive(user._id, user.isActive)}
                      >
                        {user.isActive ? (
                          <><XCircle className="w-4 h-4 mr-1" /> Deactivate</>
                        ) : (
                          <><CheckCircle className="w-4 h-4 mr-1" /> Activate</>
                        )}
                      </Button>
                    </div>
                  </div>
                )}
              </Card>
            );
          })}
        </div>

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 mt-8">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page - 1 }))}
              disabled={pagination.currentPage === 1}
            >
              Previous
            </Button>
            <span className="text-sm text-slate-600">
              Page {pagination.currentPage} of {pagination.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPagination(p => ({ ...p, page: p.page + 1 }))}
              disabled={pagination.currentPage === pagination.totalPages}
            >
              Next
            </Button>
          </div>
        )}

        {/* Empty State */}
        {users.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <User className="w-16 h-16 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-slate-900 mb-2">No users found</h3>
            <p className="text-slate-600 mb-6">Try adjusting your search filters.</p>
            <Button variant="outline" onClick={() => setFilters({ search: '', role: '', isActive: '' })}>
              Clear Filters
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default UserManagement;