export interface FirewallRule {
  id: string;
  name: string;
  action: 'ALLOW' | 'DENY';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  priority: number;
  enabled: boolean;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface RuleFormData {
  name: string;
  action: 'ALLOW' | 'DENY';
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ALL';
  sourceIp: string;
  sourcePort: string;
  destinationIp: string;
  destinationPort: string;
  description: string;
}

export interface ValidationError {
  field: string;
  message: string;
}