import React from 'react';
import { Shield, ShieldCheck, ShieldX, Activity, TrendingUp, Clock } from 'lucide-react';
import { FirewallRule } from '../types';

interface DashboardProps {
  rules: FirewallRule[];
}

const Dashboard: React.FC<DashboardProps> = ({ rules }) => {
  const enabledRules = rules.filter(rule => rule.enabled);
  const disabledRules = rules.filter(rule => !rule.enabled);
  const allowRules = enabledRules.filter(rule => rule.action === 'ALLOW');
  const denyRules = enabledRules.filter(rule => rule.action === 'DENY');
  
  const recentRules = rules
    .sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime())
    .slice(0, 3);

  const stats = [
    {
      label: 'Total Rules',
      value: rules.length,
      icon: Shield,
      color: 'text-blue-600 bg-blue-50 border-blue-200',
      trend: rules.length > 0 ? '+' + rules.length : '0',
    },
    {
      label: 'Active Rules',
      value: enabledRules.length,
      icon: Activity,
      color: 'text-emerald-600 bg-emerald-50 border-emerald-200',
      trend: enabledRules.length > 0 ? '+' + enabledRules.length : '0',
    },
    {
      label: 'Allow Rules',
      value: allowRules.length,
      icon: ShieldCheck,
      color: 'text-green-600 bg-green-50 border-green-200',
      trend: allowRules.length > 0 ? '+' + allowRules.length : '0',
    },
    {
      label: 'Deny Rules',
      value: denyRules.length,
      icon: ShieldX,
      color: 'text-red-600 bg-red-50 border-red-200',
      trend: denyRules.length > 0 ? '+' + denyRules.length : '0',
    },
  ];

  return (
    <div className="space-y-6 mb-8">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl border-2 border-gray-100 p-6 hover:shadow-lg transition-all duration-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 mb-1">{stat.label}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <TrendingUp className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-sm text-green-600 font-medium">{stat.trend}</span>
                </div>
              </div>
              <div className={`p-4 rounded-xl border-2 ${stat.color}`}>
                <stat.icon className="w-8 h-8" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Rule Status */}
        <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Rule Status</h3>
            <Activity className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg border border-emerald-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-emerald-500 rounded-full"></div>
                <span className="font-medium text-emerald-800">Enabled Rules</span>
              </div>
              <span className="text-emerald-700 font-bold">{enabledRules.length}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center space-x-3">
                <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                <span className="font-medium text-gray-700">Disabled Rules</span>
              </div>
              <span className="text-gray-600 font-bold">{disabledRules.length}</span>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl border-2 border-gray-100 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Activity</h3>
            <Clock className="w-5 h-5 text-blue-600" />
          </div>
          <div className="space-y-3">
            {recentRules.length > 0 ? (
              recentRules.map((rule, index) => (
                <div key={rule.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`w-3 h-3 rounded-full ${
                      rule.action === 'ALLOW' ? 'bg-green-500' : 'bg-red-500'
                    }`}></div>
                    <span className="font-medium text-gray-800 truncate max-w-32">{rule.name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {rule.updatedAt.toLocaleDateString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="text-center py-4 text-gray-500">
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;