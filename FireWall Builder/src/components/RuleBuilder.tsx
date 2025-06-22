import React, { useState, useEffect } from 'react';
import { Save, X, AlertCircle, Info } from 'lucide-react';
import { FirewallRule, RuleFormData, ValidationError } from '../types';
import { validateRule, generateId } from '../utils';

interface RuleBuilderProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (rule: FirewallRule) => void;
  editingRule?: FirewallRule;
  nextPriority: number;
}

const RuleBuilder: React.FC<RuleBuilderProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRule,
  nextPriority,
}) => {
  const [formData, setFormData] = useState<RuleFormData>({
    name: '',
    action: 'ALLOW',
    protocol: 'TCP',
    sourceIp: '*',
    sourcePort: '*',
    destinationIp: '*',
    destinationPort: '*',
    description: '',
  });

  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingRule) {
      setFormData({
        name: editingRule.name,
        action: editingRule.action,
        protocol: editingRule.protocol,
        sourceIp: editingRule.sourceIp,
        sourcePort: editingRule.sourcePort,
        destinationIp: editingRule.destinationIp,
        destinationPort: editingRule.destinationPort,
        description: editingRule.description || '',
      });
    } else {
      setFormData({
        name: '',
        action: 'ALLOW',
        protocol: 'TCP',
        sourceIp: '*',
        sourcePort: '*',
        destinationIp: '*',
        destinationPort: '*',
        description: '',
      });
    }
    setErrors([]);
  }, [editingRule, isOpen]);

  const handleInputChange = (field: keyof RuleFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(error => error.field !== field));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const validationErrors = validateRule(formData);
    
    if (validationErrors.length > 0) {
      setErrors(validationErrors);
      setIsSubmitting(false);
      return;
    }

    const now = new Date();
    const rule: FirewallRule = {
      id: editingRule?.id || generateId(),
      ...formData,
      priority: editingRule?.priority || nextPriority,
      enabled: editingRule?.enabled ?? true,
      createdAt: editingRule?.createdAt || now,
      updatedAt: now,
    };

    await new Promise(resolve => setTimeout(resolve, 500));
    
    onSave(rule);
    setIsSubmitting(false);
    onClose();
  };

  const getFieldError = (field: string): string | undefined => {
    return errors.find(error => error.field === field)?.message;
  };

  const handleProtocolChange = (protocol: string) => {
    const newFormData = { ...formData, protocol: protocol as any };
    
    if (protocol === 'ICMP') {
      newFormData.sourcePort = '*';
      newFormData.destinationPort = '*';
    }
    
    setFormData(newFormData);
    setErrors(prev => prev.filter(error => !['sourcePort', 'destinationPort'].includes(error.field)));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-semibold text-gray-900">
                {editingRule ? 'Edit Firewall Rule' : 'Create New Firewall Rule'}
              </h2>
              <p className="text-sm text-gray-600 mt-1">
                Configure network access rules for your firewall
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900 flex items-center">
              <Info className="w-5 h-5 mr-2 text-blue-600" />
              Basic Information
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Rule Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    getFieldError('name') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="Enter a descriptive name for this rule"
                />
                {getFieldError('name') && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('name')}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Action *
                </label>
                <select
                  value={formData.action}
                  onChange={(e) => handleInputChange('action', e.target.value as 'ALLOW' | 'DENY')}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="ALLOW">Allow Traffic</option>
                  <option value="DENY">Deny Traffic</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Protocol *
                </label>
                <select
                  value={formData.protocol}
                  onChange={(e) => handleProtocolChange(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="TCP">TCP</option>
                  <option value="UDP">UDP</option>
                  <option value="ICMP">ICMP</option>
                  <option value="ALL">All Protocols</option>
                </select>
              </div>
            </div>
          </div>

          {/* Source Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Source Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source IP Address *
                </label>
                <input
                  type="text"
                  value={formData.sourceIp}
                  onChange={(e) => handleInputChange('sourceIp', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    getFieldError('sourceIp') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 192.168.1.0/24, 10.0.0.1, *"
                />
                {getFieldError('sourceIp') && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('sourceIp')}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Use * for any IP, CIDR notation for ranges
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Source Port
                </label>
                <input
                  type="text"
                  value={formData.sourcePort}
                  onChange={(e) => handleInputChange('sourcePort', e.target.value)}
                  disabled={formData.protocol === 'ICMP'}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formData.protocol === 'ICMP' ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${getFieldError('sourcePort') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="e.g., 80, 80-90, 80,443, *"
                />
                {getFieldError('sourcePort') && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('sourcePort')}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Single port, range, or comma-separated list
                </p>
              </div>
            </div>
          </div>

          {/* Destination Configuration */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Destination Configuration</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination IP Address *
                </label>
                <input
                  type="text"
                  value={formData.destinationIp}
                  onChange={(e) => handleInputChange('destinationIp', e.target.value)}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    getFieldError('destinationIp') ? 'border-red-500 bg-red-50' : 'border-gray-300'
                  }`}
                  placeholder="e.g., 10.0.0.0/8, 172.16.0.1, *"
                />
                {getFieldError('destinationIp') && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('destinationIp')}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Use * for any IP, CIDR notation for ranges
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Destination Port
                </label>
                <input
                  type="text"
                  value={formData.destinationPort}
                  onChange={(e) => handleInputChange('destinationPort', e.target.value)}
                  disabled={formData.protocol === 'ICMP'}
                  className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                    formData.protocol === 'ICMP' ? 'bg-gray-100 cursor-not-allowed' : ''
                  } ${getFieldError('destinationPort') ? 'border-red-500 bg-red-50' : 'border-gray-300'}`}
                  placeholder="e.g., 443, 8000-9000, 22,80,443, *"
                />
                {getFieldError('destinationPort') && (
                  <div className="mt-2 flex items-center text-sm text-red-600">
                    <AlertCircle className="w-4 h-4 mr-1" />
                    {getFieldError('destinationPort')}
                  </div>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Single port, range, or comma-separated list
                </p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Optional description explaining the purpose of this rule"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              <span>{editingRule ? 'Update Rule' : 'Create Rule'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RuleBuilder;