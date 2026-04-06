import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Plus, Edit2, Trash2, Search, Filter, Save, X,
  ArrowUp, ArrowDown, AlertTriangle, CheckCircle
} from 'lucide-react';
import { Card, CardHeader, CardContent, CardFooter } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory,
  reorderCategories 
} from '../../services/categoryService';
import toast from 'react-hot-toast';

const CATEGORIES = {
  icons: ['MessageSquare', 'Shield', 'Brain', 'BarChart3', 'Users', 'AlertTriangle', 'CheckCircle', 'Settings', 'Home', 'Briefcase', 'Heart', 'Star'],
  colors: [
    { value: 'indigo', class: 'bg-indigo-100 text-indigo-700' },
    { value: 'blue', class: 'bg-blue-100 text-blue-700' },
    { value: 'green', class: 'bg-green-100 text-green-700' },
    { value: 'red', class: 'bg-red-100 text-red-700' },
    { value: 'orange', class: 'bg-orange-100 text-orange-700' },
    { value: 'purple', class: 'bg-purple-100 text-purple-700' },
    { value: 'pink', class: 'bg-pink-100 text-pink-700' },
    { value: 'yellow', class: 'bg-yellow-100 text-yellow-700' },
    { value: 'teal', class: 'bg-teal-100 text-teal-700' }
  ]
};

const Categories = () => {
  const navigate = useNavigate();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    icon: 'MessageSquare',
    color: 'indigo',
    order: 0,
    isActive: true
  });

  useEffect(() => {
    fetchCategories();
  }, [search]);

  const fetchCategories = async () => {
    setLoading(true);
    try {
      const response = await getCategories({ search });
      setCategories(response.data.categories);
    } catch (error) {
      toast.error('Failed to load categories');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateCategory(editingId, formData);
        toast.success('Category updated successfully');
      } else {
        await createCategory(formData);
        toast.success('Category created successfully');
      }
      setShowForm(false);
      setEditingId(null);
      setFormData({ name: '', description: '', icon: 'MessageSquare', color: 'indigo', order: 0, isActive: true });
      fetchCategories();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save category');
    }
  };

  const handleEdit = (category) => {
    setFormData({
      name: category.name,
      description: category.description || '',
      icon: category.icon,
      color: category.color,
      order: category.order,
      isActive: category.isActive
    });
    setEditingId(category._id);
    setShowForm(true);
  };

  const handleDelete = async (id, name, feedbackCount) => {
    if (feedbackCount > 0) {
      const confirmed = window.confirm(
        `This category has ${feedbackCount} feedback items. \n\n` +
        `Click OK to deactivate (keeps feedback history)\n` +
        `Click Cancel to cancel`
      );
      if (!confirmed) return;
    }

    try {
      await deleteCategory(id, false);
      toast.success('Category deactivated');
      fetchCategories();
    } catch (error) {
      toast.error('Failed to delete category');
    }
  };

  const handleReorder = async (index, direction) => {
    const newCategories = [...categories];
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === newCategories.length - 1)
    ) return;

    const swapIndex = direction === 'up' ? index - 1 : index + 1;
    [newCategories[index], newCategories[swapIndex]] = [newCategories[swapIndex], newCategories[index]];
    
    // Update order values
    newCategories.forEach((cat, i) => {
      cat.order = i;
    });

    setCategories(newCategories);
    
    try {
      await reorderCategories(newCategories.map(c => ({ _id: c._id, order: c.order })));
      toast.success('Order updated');
    } catch (error) {
      toast.error('Failed to reorder');
      fetchCategories();
    }
  };

  const getColorClass = (color) => {
    return CATEGORIES.colors.find(c => c.value === color)?.class || 'bg-slate-100 text-slate-700';
  };

  if (loading && categories.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Category Management</h1>
            <p className="text-slate-600">Manage feedback categories for your organization</p>
          </div>
          <Button onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4 mr-2" />
            {showForm ? 'Cancel' : 'Add Category'}
          </Button>
        </div>

        {/* Form */}
        {showForm && (
          <Card className="mb-8 animate-slide-up">
            <form onSubmit={handleSubmit}>
              <CardHeader>
                <h3 className="font-semibold text-slate-900">
                  {editingId ? 'Edit Category' : 'Create New Category'}
                </h3>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Name *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="e.g., Facilities"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Brief description"
                    />
                  </div>
                </div>

                <div className="grid md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Icon</label>
                    <select
                      value={formData.icon}
                      onChange={(e) => setFormData({ ...formData, icon: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORIES.icons.map(icon => (
                        <option key={icon} value={icon}>{icon}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Color</label>
                    <select
                      value={formData.color}
                      onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      {CATEGORIES.colors.map(color => (
                        <option key={color.value} value={color.value}>
                          {color.value.charAt(0).toUpperCase() + color.value.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Order</label>
                    <input
                      type="number"
                      value={formData.order}
                      onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) })}
                      className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
                      min="0"
                    />
                  </div>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={formData.isActive}
                    onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                    className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                  />
                  <label htmlFor="isActive" className="ml-2 text-sm text-slate-700">
                    Active (visible in feedback form)
                  </label>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end space-x-3">
                <Button type="button" variant="ghost" onClick={() => { setShowForm(false); setEditingId(null); }}>
                  Cancel
                </Button>
                <Button type="submit">
                  <Save className="w-4 h-4 mr-2" />
                  {editingId ? 'Update' : 'Create'}
                </Button>
              </CardFooter>
            </form>
          </Card>
        )}

        {/* Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search categories..."
                className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </CardContent>
        </Card>

        {/* Categories List */}
        <div className="space-y-4">
          {categories.map((category, index) => (
            <Card key={category._id} hover className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  {/* Reorder Buttons */}
                  <div className="flex flex-col space-y-1">
                    <button
                      onClick={() => handleReorder(index, 'up')}
                      disabled={index === 0}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <ArrowUp className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleReorder(index, 'down')}
                      disabled={index === categories.length - 1}
                      className="p-1 hover:bg-slate-100 rounded disabled:opacity-30"
                    >
                      <ArrowDown className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Category Info */}
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${getColorClass(category.color)}`}>
                    <span className="text-sm font-medium">{category.name[0]}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-slate-900">{category.name}</h3>
                      {!category.isActive && (
                        <Badge variant="neutral">Inactive</Badge>
                      )}
                    </div>
                    {category.description && (
                      <p className="text-sm text-slate-500">{category.description}</p>
                    )}
                    <p className="text-xs text-slate-400 mt-1">
                      {category.feedbackCount || 0} feedback items • Order: {category.order}
                    </p>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEdit(category)}>
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleDelete(category._id, category.name, category.feedbackCount)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {categories.length === 0 && !loading && (
          <Card className="p-12 text-center">
            <p className="text-slate-500 mb-4">No categories found</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create First Category
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Categories;