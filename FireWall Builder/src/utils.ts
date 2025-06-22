import { FirewallRule, RuleFormData, ValidationError } from './types';

export const validateIP = (ip: string): boolean => {
  if (ip === '*' || ip === 'ANY' || ip.toLowerCase() === 'any') return true;
  
  // IPv4 address validation
  const ipv4Regex = /^(\d{1,3}\.){3}\d{1,3}$/;
  const cidrRegex = /^(\d{1,3}\.){3}\d{1,3}\/\d{1,2}$/;
  const rangeRegex = /^(\d{1,3}\.){3}\d{1,3}-(\d{1,3}\.){3}\d{1,3}$/;
  
  if (ipv4Regex.test(ip)) {
    const parts = ip.split('.');
    return parts.every(part => {
      const num = parseInt(part);
      return num >= 0 && num <= 255;
    });
  }
  
  if (cidrRegex.test(ip)) {
    const [ipPart, cidr] = ip.split('/');
    const cidrNum = parseInt(cidr);
    return validateIP(ipPart) && cidrNum >= 0 && cidrNum <= 32;
  }
  
  if (rangeRegex.test(ip)) {
    const [start, end] = ip.split('-');
    return validateIP(start) && validateIP(end);
  }
  
  return false;
};

export const validatePort = (port: string, protocol: string): boolean => {
  if (port === '*' || port === 'ANY' || port.toLowerCase() === 'any') return true;
  if (protocol === 'ICMP') return true;
  
  // Handle comma-separated ports
  if (port.includes(',')) {
    return port.split(',').every(p => validatePort(p.trim(), protocol));
  }
  
  // Handle port ranges
  if (port.includes('-')) {
    const [start, end] = port.split('-').map(p => parseInt(p.trim()));
    return !isNaN(start) && !isNaN(end) && start >= 1 && start <= 65535 && 
           end >= 1 && end <= 65535 && start <= end;
  }
  
  const portNum = parseInt(port);
  return !isNaN(portNum) && portNum >= 1 && portNum <= 65535;
};

export const validateRule = (rule: RuleFormData): ValidationError[] => {
  const errors: ValidationError[] = [];
  
  if (!rule.name?.trim()) {
    errors.push({ field: 'name', message: 'Rule name is required' });
  }
  
  if (!rule.sourceIp?.trim()) {
    errors.push({ field: 'sourceIp', message: 'Source IP is required' });
  } else if (!validateIP(rule.sourceIp)) {
    errors.push({ field: 'sourceIp', message: 'Invalid IP address format' });
  }
  
  if (!rule.destinationIp?.trim()) {
    errors.push({ field: 'destinationIp', message: 'Destination IP is required' });
  } else if (!validateIP(rule.destinationIp)) {
    errors.push({ field: 'destinationIp', message: 'Invalid IP address format' });
  }
  
  if (rule.sourcePort && !validatePort(rule.sourcePort, rule.protocol)) {
    errors.push({ field: 'sourcePort', message: 'Invalid port format' });
  }
  
  if (rule.destinationPort && !validatePort(rule.destinationPort, rule.protocol)) {
    errors.push({ field: 'destinationPort', message: 'Invalid port format' });
  }
  
  return errors;
};

export const exportToIptables = (rules: FirewallRule[]): string => {
  const enabledRules = rules.filter(rule => rule.enabled).sort((a, b) => a.priority - b.priority);
  
  let output = '#!/bin/bash\n';
  output += '# Generated Firewall Rules\n';
  output += `# Generated on: ${new Date().toISOString()}\n`;
  output += `# Total rules: ${enabledRules.length}\n\n`;
  
  output += '# Flush existing rules\n';
  output += 'iptables -F\n';
  output += 'iptables -X\n';
  output += 'iptables -t nat -F\n';
  output += 'iptables -t nat -X\n\n';
  
  output += '# Set default policies\n';
  output += 'iptables -P INPUT DROP\n';
  output += 'iptables -P FORWARD DROP\n';
  output += 'iptables -P OUTPUT ACCEPT\n\n';
  
  output += '# Allow loopback traffic\n';
  output += 'iptables -A INPUT -i lo -j ACCEPT\n';
  output += 'iptables -A OUTPUT -o lo -j ACCEPT\n\n';
  
  output += '# Allow established and related connections\n';
  output += 'iptables -A INPUT -m state --state ESTABLISHED,RELATED -j ACCEPT\n\n';
  
  enabledRules.forEach((rule, index) => {
    output += `# Rule ${index + 1}: ${rule.name}\n`;
    if (rule.description) {
      output += `# Description: ${rule.description}\n`;
    }
    
    let command = 'iptables -A INPUT';
    
    if (rule.protocol !== 'ALL') {
      command += ` -p ${rule.protocol.toLowerCase()}`;
    }
    
    if (rule.sourceIp !== '*' && rule.sourceIp !== 'ANY') {
      command += ` -s ${rule.sourceIp}`;
    }
    
    if (rule.destinationIp !== '*' && rule.destinationIp !== 'ANY') {
      command += ` -d ${rule.destinationIp}`;
    }
    
    if (rule.protocol !== 'ICMP' && rule.protocol !== 'ALL') {
      if (rule.sourcePort && rule.sourcePort !== '*' && rule.sourcePort !== 'ANY') {
        command += ` --sport ${rule.sourcePort}`;
      }
      
      if (rule.destinationPort && rule.destinationPort !== '*' && rule.destinationPort !== 'ANY') {
        command += ` --dport ${rule.destinationPort}`;
      }
    }
    
    command += rule.action === 'ALLOW' ? ' -j ACCEPT' : ' -j DROP';
    output += command + '\n\n';
  });
  
  output += '# Log dropped packets (optional)\n';
  output += '# iptables -A INPUT -j LOG --log-prefix "DROPPED: "\n\n';
  
  return output;
};

export const exportToJSON = (rules: FirewallRule[]): string => {
  const exportData = {
    version: '1.0',
    exportDate: new Date().toISOString(),
    totalRules: rules.length,
    rules: rules.map(rule => ({
      ...rule,
      createdAt: rule.createdAt.toISOString(),
      updatedAt: rule.updatedAt.toISOString()
    }))
  };
  
  return JSON.stringify(exportData, null, 2);
};

export const generateId = (): string => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
};

export const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
};