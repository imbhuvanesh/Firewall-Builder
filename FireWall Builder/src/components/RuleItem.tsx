import React from 'react';
import { Edit, Trash2, Shield, ShieldOff, Globe, Server, Network, AlertTriangle } from 'lucide-react';
import { FirewallRule } from '../types';
import { formatDate } from '../utils';

interface RuleItemProps {
  rule: FirewallRule;
  onEdit: (rule: FirewallRule) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const RuleItem: React.FC<RuleItemProps> = ({ rule, onEdit, onDelete, onToggle }) => {
  const getActionColor = (action: string, enabled: boolean) => {
    if (!enabled) return 'text-gray-500 bg-gray-100';
    return action === 'ALLOW' 
      ? 'text-emerald-700 bg-emerald-100 border-emerald-200' 
      : 'text-red-700 bg-red-100 border-red-200';
  };

  const getProtocolIcon = (protocol: string) => {
    switch (protocol) {
      case 'TCP':
        return <Server className="w-4 h-4" />;
      case 'UDP':
        return <Globe className="w-4 h-4" />;
      case 'ICMP':
        return <Network className="w-4 h-4" />;
      default:
        return <Shield className="w-4 h-4" />;
    }
  };

  const formatAddress = (ip: string, port: string, protocol: string) => {
    if (ip === '*' || ip === 'ANY') ip = 'Any';
    if (port === '*' || port === 'ANY') port = 'Any';
    
    if (protocol === 'ICMP' || port === 'Any') {
      return ip;
    }
    
    return `${ip}:${port}`;
  };

  return (
    <div className={`bg-white rounded-xl border-2 p-6 transition-all duration-200 hover:shadow-lg ${
      rule.enabled 
        ? 'border-gray-200 hover:border-blue-300' 
        : 'border-gray-100 bg-gray-50 opacity-75'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center space-x-3 mb-3">
            <h3 className={`text-lg font-semibold ${rule.enabled ? 'text-gray-900' : 'text-gray-500'}`}>
              {rule.name}
            </h3>
            <span className={`px-3 py-1 rounded-full text-sm font-medium border ${getActionColor(rule.action, rule.enabled)}`}>
              {rule.action}
            </span>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
              rule.enabled ? 'text-blue-700 bg-blue-100' : 'text-gray-500 bg-gray-100'
            }`}>
              {getProtocolIcon(rule.protocol)}
              <span className="text-sm font-medium">{rule.protocol}</span>
            </div>
            <div className={`flex items-center space-x-1 px-2 py-1 rounded-lg ${
              rule.enabled ? 'text-purple-700 bg-purple-100' : 'text-gray-500 bg-gray-100'
            }`}>
              <span className="text-sm font-medium">Priority #{rule.priority}</span>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Source:</span>
                <code className={`px-2 py-1 rounded text-sm font-mono ${
                  rule.enabled ? 'bg-blue-50 text-blue-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {formatAddress(rule.sourceIp, rule.sourcePort, rule.protocol)}
                </code>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Destination:</span>
                <code className={`px-2 py-1 rounded text-sm font-mono ${
                  rule.enabled ? 'bg-green-50 text-green-800' : 'bg-gray-100 text-gray-600'
                }`}>
                  {formatAddress(rule.destinationIp, rule.destinationPort, rule.protocol)}
                </code>
              </div>
            </div>
          </div>
          
          {rule.description && (
            <p className={`text-sm mb-3 p-3 rounded-lg ${
              rule.enabled ? 'text-gray-700 bg-gray-50' : 'text-gray-500 bg-gray-100'
            }`}>
              {rule.description}
            </p>
          )}
          
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Created: {formatDate(rule.createdAt)}</span>
            {rule.updatedAt > rule.createdAt && (
              <span>Updated: {formatDate(rule.updatedAt)}</span>
            )}
          </div>
        </div>
        
        <div className="flex items-center space-x-2 ml-6">
          <button
            onClick={() => onToggle(rule.id)}
            className={`p-3 rounded-lg transition-all duration-200 ${
              rule.enabled 
                ? 'text-emerald-600 hover:bg-emerald-50 bg-emerald-100' 
                : 'text-gray-400 hover:bg-gray-100 bg-gray-50'
            }`}
            title={rule.enabled ? 'Disable rule' : 'Enable rule'}
          >
            {rule.enabled ? <Shield className="w-5 h-5" /> : <ShieldOff className="w-5 h-5" />}
          </button>
          <button
            onClick={() => onEdit(rule)}
            className="p-3 text-blue-600 hover:bg-blue-50 bg-blue-100 rounded-lg transition-all duration-200"
            title="Edit rule"
          >
            <Edit className="w-5 h-5" />
          </button>
          <button
            onClick={() => onDelete(rule.id)}
            className="p-3 text-red-600 hover:bg-red-50 bg-red-100 rounded-lg transition-all duration-200"
            title="Delete rule"
          >
            <Trash2 className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      {!rule.enabled && (
        <div className="mt-4 flex items-center space-x-2 text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
          <AlertTriangle className="w-4 h-4" />
          <span className="text-sm font-medium">This rule is currently disabled</span>
        </div>
      )}
    </div>
  );
};

export default RuleItem;