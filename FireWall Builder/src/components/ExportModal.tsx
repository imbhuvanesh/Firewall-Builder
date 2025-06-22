import React, { useState } from 'react';
import { Download, Copy, Check, X } from 'lucide-react';
import { FirewallRule } from '../types';
import { exportToIptables, exportToJSON } from '../utils';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  rules: FirewallRule[];
}

const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, rules }) => {
  const [format, setFormat] = useState<'json' | 'iptables'>('json');
  const [copied, setCopied] = useState(false);

  const exportData = format === 'json' ? exportToJSON(rules) : exportToIptables(rules);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(exportData);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleDownload = () => {
    const blob = new Blob([exportData], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `firewall-rules.${format === 'json' ? 'json' : 'sh'}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
          <h2 className="text-xl font-semibold text-gray-900">Export Firewall Rules</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <div className="p-6">
          <div className="flex items-center space-x-4 mb-6">
            <label className="text-sm font-medium text-gray-700">Export Format:</label>
            <div className="flex space-x-2">
              <button
                onClick={() => setFormat('json')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  format === 'json'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                JSON
              </button>
              <button
                onClick={() => setFormat('iptables')}
                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                  format === 'iptables'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                iptables
              </button>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">
                {format === 'json' ? 'JSON Configuration' : 'iptables Script'}
              </span>
              <div className="flex space-x-2">
                <button
                  onClick={handleCopy}
                  className="flex items-center space-x-1 px-3 py-1 bg-white hover:bg-gray-50 border border-gray-300 rounded-lg text-sm font-medium transition-colors"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? 'Copied!' : 'Copy'}</span>
                </button>
                <button
                  onClick={handleDownload}
                  className="flex items-center space-x-1 px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors"
                >
                  <Download className="w-4 h-4" />
                  <span>Download</span>
                </button>
              </div>
            </div>
            <pre className="bg-white border border-gray-200 rounded-lg p-4 text-sm overflow-x-auto max-h-96 overflow-y-auto">
              <code>{exportData}</code>
            </pre>
          </div>

          <div className="text-sm text-gray-600">
            {format === 'json' ? (
              <p>
                This JSON file contains all your firewall rules and can be imported back into the
                Firewall Builder. It includes metadata like creation dates and descriptions.
              </p>
            ) : (
              <p>
                This shell script contains iptables commands that can be executed on a Linux system
                to apply your firewall rules. Make sure to review the script before execution.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportModal;