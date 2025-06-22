import React, { useState, useEffect } from 'react';
import { Plus, Download, Upload, Search, Filter, Shield, RefreshCw } from 'lucide-react';
import { FirewallRule } from './types';
import RuleBuilder from './components/RuleBuilder';
import RuleItem from './components/RuleItem';
import Dashboard from './components/Dashboard';
import ExportModal from './components/ExportModal';
import { generateId } from './utils';

function App() {
  const [rules, setRules] = useState<FirewallRule[]>([]);
  const [filteredRules, setFilteredRules] = useState<FirewallRule[]>([]);
  const [showRuleBuilder, setShowRuleBuilder] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [editingRule, setEditingRule] = useState<FirewallRule | undefined>();
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAction, setFilterAction] = useState<'ALL' | 'ALLOW' | 'DENY'>('ALL');
  const [filterStatus, setFilterStatus] = useState<'ALL' | 'ENABLED' | 'DISABLED'>('ALL');
  const [isLoading, setIsLoading] = useState(true);

  // Load sample data on first load
  useEffect(() => {
    const loadSampleData = async () => {
      setIsLoading(true);
      
      // Simulate loading delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const sampleRules: FirewallRule[] = [
        {
          id: generateId(),
          name: 'Allow SSH Access',
          action: 'ALLOW',
          protocol: 'TCP',
          sourceIp: '*',
          sourcePort: '*',
          destinationIp: '*',
          destinationPort: '22',
          priority: 1,
          enabled: true,
          description: 'Allow SSH connections from any source for remote administration',
          createdAt: new Date('2024-01-15T10:30:00'),
          updatedAt: new Date('2024-01-15T10:30:00'),
        },
        {
          id: generateId(),
          name: 'Allow Web Traffic',
          action: 'ALLOW',
          protocol: 'TCP',
          sourceIp: '*',
          sourcePort: '*',
          destinationIp: '*',
          destinationPort: '80,443',
          priority: 2,
          enabled: true,
          description: 'Allow HTTP and HTTPS traffic for web services',
          createdAt: new Date('2024-01-15T11:00:00'),
          updatedAt: new Date('2024-01-15T11:00:00'),
        },
        {
          id: generateId(),
          name: 'Block Suspicious Network',
          action: 'DENY',
          protocol: 'ALL',
          sourceIp: '192.168.100.0/24',
          sourcePort: '*',
          destinationIp: '*',
          destinationPort: '*',
          priority: 3,
          enabled: true,
          description: 'Block all traffic from suspicious IP range identified by security team',
          createdAt: new Date('2024-01-16T09:15:00'),
          updatedAt: new Date('2024-01-16T09:15:00'),
        },
        {
          id: generateId(),
          name: 'Allow DNS Queries',
          action: 'ALLOW',
          protocol: 'UDP',
          sourceIp: '*',
          sourcePort: '*',
          destinationIp: '8.8.8.8,8.8.4.4',
          destinationPort: '53',
          priority: 4,
          enabled: true,
          description: 'Allow DNS queries to Google DNS servers',
          createdAt: new Date('2024-01-16T14:20:00'),
          updatedAt: new Date('2024-01-16T14:20:00'),
        },
        {
          id: generateId(),
          name: 'Block P2P Traffic',
          action: 'DENY',
          protocol: 'TCP',
          sourceIp: '*',
          sourcePort: '*',
          destinationIp: '*',
          destinationPort: '6881-6889',
          priority: 5,
          enabled: false,
          description: 'Block BitTorrent and other P2P traffic (currently disabled for testing)',
          createdAt: new Date('2024-01-17T16:45:00'),
          updatedAt: new Date('2024-01-17T16:45:00'),
        },
      ];
      
      setRules(sampleRules);
      setIsLoading(false);
    };

    loadSampleData();
  }, []);

  // Filter rules based on search and filters
  useEffect(() => {
    let filtered = rules;

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(rule =>
        rule.name.toLowerCase().includes(term) ||
        rule.description?.toLowerCase().includes(term) ||
        rule.sourceIp.toLowerCase().includes(term) ||
        rule.destinationIp.toLowerCase().includes(term) ||
        rule.sourcePort.toLowerCase().includes(term) ||
        rule.destinationPort.toLowerCase().includes(term) ||
        rule.protocol.toLowerCase().includes(term)
      );
    }

    if (filterAction !== 'ALL') {
      filtered = filtered.filter(rule => rule.action === filterAction);
    }

    if (filterStatus !== 'ALL') {
      filtered = filtered.filter(rule => 
        filterStatus === 'ENABLED' ? rule.enabled : !rule.enabled
      );
    }

    // Sort by priority
    filtered = filtered.sort((a, b) => a.priority - b.priority);

    setFilteredRules(filtered);
  }, [rules, searchTerm, filterAction, filterStatus]);

  const handleSaveRule = (rule: FirewallRule) => {
    setRules(prev => {
      const existingIndex = prev.findIndex(r => r.id === rule.id);
      if (existingIndex >= 0) {
        const updated = [...prev];
        updated[existingIndex] = rule;
        return updated;
      } else {
        return [...prev, rule];
      }
    });
  };

  const handleEditRule = (rule: FirewallRule) => {
    setEditingRule(rule);
    setShowRuleBuilder(true);
  };

  const handleDeleteRule = (id: string) => {
    const rule = rules.find(r => r.id === id);
    if (rule && window.confirm(`Are you sure you want to delete the rule "${rule.name}"?`)) {
      setRules(prev => prev.filter(rule => rule.id !== id));
    }
  };

  const handleToggleRule = (id: string) => {
    setRules(prev =>
      prev.map(rule =>
        rule.id === id ? { ...rule, enabled: !rule.enabled, updatedAt: new Date() } : rule
      )
    );
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const parsed = JSON.parse(content);
        
        // Handle both old format and new format with metadata
        const importedRules = parsed.rules || parsed;
        
        if (!Array.isArray(importedRules)) {
          throw new Error('Invalid file format');
        }
        
        const validRules = importedRules
          .filter(rule => rule.id && rule.name && rule.action)
          .map(rule => ({
            ...rule,
            id: generateId(), // Generate new IDs to avoid conflicts
            createdAt: new Date(rule.createdAt),
            updatedAt: new Date(rule.updatedAt),
          }));
        
        if (validRules.length === 0) {
          alert('No valid rules found in the imported file');
          return;
        }
        
        setRules(prev => [...prev, ...validRules]);
        alert(`Successfully imported ${validRules.length} rule(s)`);
      } catch (error) {
        alert('Invalid JSON file format. Please check your file and try again.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const handleClearFilters = () => {
    setSearchTerm('');
    setFilterAction('ALL');
    setFilterStatus('ALL');
  };

  const nextPriority = Math.max(...rules.map(r => r.priority), 0) + 1;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading Firewall Builder</h2>
          <p className="text-gray-600">Initializing your security configuration...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
                <Shield className="w-10 h-10 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-gray-900">Firewall Builder</h1>
                <p className="text-lg text-gray-600 mt-1">Create and manage your network security rules</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <label className="flex items-center space-x-2 px-4 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl cursor-pointer transition-all duration-200 shadow-sm">
                <Upload className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Import Rules</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={handleImport}
                  className="hidden"
                />
              </label>
              <button
                onClick={() => setShowExportModal(true)}
                className="flex items-center space-x-2 px-4 py-3 bg-white hover:bg-gray-50 border-2 border-gray-200 hover:border-blue-300 rounded-xl transition-all duration-200 shadow-sm"
              >
                <Download className="w-5 h-5 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">Export Rules</span>
              </button>
              <button
                onClick={() => {
                  setEditingRule(undefined);
                  setShowRuleBuilder(true);
                }}
                className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl"
              >
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">New Rule</span>
              </button>
            </div>
          </div>
        </div>

        {/* Dashboard */}
        <Dashboard rules={rules} />

        {/* Search and Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8 shadow-sm">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 lg:space-x-6">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search rules by name, IP, port, or description..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-12 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              />
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Filter className="w-5 h-5 text-gray-500" />
                <select
                  value={filterAction}
                  onChange={(e) => setFilterAction(e.target.value as any)}
                  className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  <option value="ALL">All Actions</option>
                  <option value="ALLOW">Allow Only</option>
                  <option value="DENY">Deny Only</option>
                </select>
              </div>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              >
                <option value="ALL">All Rules</option>
                <option value="ENABLED">Enabled Only</option>
                <option value="DISABLED">Disabled Only</option>
              </select>
              {(searchTerm || filterAction !== 'ALL' || filterStatus !== 'ALL') && (
                <button
                  onClick={handleClearFilters}
                  className="flex items-center space-x-2 px-4 py-3 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-xl transition-colors"
                  title="Clear all filters"
                >
                  <RefreshCw className="w-4 h-4" />
                  <span className="text-sm font-medium">Clear</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Rules List */}
        <div className="space-y-4">
          {filteredRules.length === 0 ? (
            <div className="bg-white rounded-xl border-2 border-gray-200 p-12 text-center shadow-sm">
              <Shield className="w-20 h-20 text-gray-300 mx-auto mb-6" />
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                {rules.length === 0 ? 'No firewall rules configured' : 'No rules match your filters'}
              </h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">
                {rules.length === 0
                  ? 'Get started by creating your first firewall rule to secure your network'
                  : 'Try adjusting your search terms or filters to find the rules you\'re looking for'}
              </p>
              {rules.length === 0 && (
                <button
                  onClick={() => {
                    setEditingRule(undefined);
                    setShowRuleBuilder(true);
                  }}
                  className="flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl mx-auto"
                >
                  <Plus className="w-5 h-5" />
                  <span className="font-medium">Create Your First Rule</span>
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Firewall Rules ({filteredRules.length})
                </h2>
                <div className="text-sm text-gray-600">
                  Showing {filteredRules.length} of {rules.length} rules
                </div>
              </div>
              {filteredRules.map((rule) => (
                <RuleItem
                  key={rule.id}
                  rule={rule}
                  onEdit={handleEditRule}
                  onDelete={handleDeleteRule}
                  onToggle={handleToggleRule}
                />
              ))}
            </>
          )}
        </div>
      </div>

      {/* Modals */}
      <RuleBuilder
        isOpen={showRuleBuilder}
        onClose={() => {
          setShowRuleBuilder(false);
          setEditingRule(undefined);
        }}
        onSave={handleSaveRule}
        editingRule={editingRule}
        nextPriority={nextPriority}
      />

      <ExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        rules={rules}
      />
    </div>
  );
}

export default App;