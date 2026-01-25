// Alert Builder Component
// Create and manage custom alerts with multi-channel delivery

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, Plus, Trash2, Edit2, Check, X,
  MessageSquare, Mail, Send, Globe, Volume2,
  TrendingUp, TrendingDown, Activity, AlertTriangle,
  ChevronDown, ChevronRight, Settings, Zap
} from 'lucide-react';
import {
  useAlertStore,
  useAlertNotifications,
  requestNotificationPermission,
  type Alert,
  type AlertChannel,
  type AlertCategory,
  type AlertTrigger
} from '../../services/alertNotifications';

interface AlertBuilderProps {
  compact?: boolean;
}

export function AlertBuilder({ compact = false }: AlertBuilderProps) {
  const [activeTab, setActiveTab] = useState<'alerts' | 'history' | 'settings'>('alerts');
  const [showCreate, setShowCreate] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  
  const { 
    alerts, 
    triggers, 
    channelConfig,
    addAlert, 
    updateAlert, 
    deleteAlert, 
    toggleAlert,
    updateChannelConfig,
    clearTriggers
  } = useAlertStore();
  
  const { unreadCount, unreadTriggers, markRead, dismiss } = useAlertNotifications();
  
  return (
    <div className={`cyber-panel ${compact ? 'p-3' : 'p-4'}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyber-yellow" />
          <span className="font-cyber text-sm text-cyber-yellow">ALERTS</span>
          {unreadCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full bg-cyber-red text-white text-[10px] font-bold">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {['alerts', 'history', 'settings'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-2 py-1 text-xs rounded capitalize ${
                activeTab === tab 
                  ? 'bg-cyber-yellow/20 text-cyber-yellow' 
                  : 'bg-cyber-darker text-cyber-muted hover:text-cyber-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>
      
      <AnimatePresence mode="wait">
        {activeTab === 'alerts' && (
          <motion.div
            key="alerts"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            {/* Create Button */}
            <button
              onClick={() => setShowCreate(true)}
              className="w-full mb-4 px-3 py-2 rounded border border-dashed border-cyber-border hover:border-cyber-yellow/50 text-cyber-muted hover:text-cyber-yellow transition-all flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              <span className="text-sm">Create New Alert</span>
            </button>
            
            {/* Alert List */}
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {alerts.length === 0 ? (
                <div className="text-center py-8 text-cyber-muted">
                  <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alerts configured</p>
                  <p className="text-xs">Create an alert to get started</p>
                </div>
              ) : (
                alerts.map((alert) => (
                  <AlertCard
                    key={alert.id}
                    alert={alert}
                    onToggle={() => toggleAlert(alert.id)}
                    onEdit={() => setEditingAlert(alert)}
                    onDelete={() => deleteAlert(alert.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'history' && (
          <motion.div
            key="history"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs text-cyber-muted">Recent Triggers</span>
              {triggers.length > 0 && (
                <button
                  onClick={clearTriggers}
                  className="text-xs text-cyber-red hover:text-cyber-red/80"
                >
                  Clear All
                </button>
              )}
            </div>
            
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {triggers.length === 0 ? (
                <div className="text-center py-8 text-cyber-muted">
                  <Activity className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No alert history</p>
                </div>
              ) : (
                triggers.map((trigger) => (
                  <TriggerCard
                    key={trigger.id}
                    trigger={trigger}
                    onMarkRead={() => markRead(trigger.id)}
                    onDismiss={() => dismiss(trigger.id)}
                  />
                ))
              )}
            </div>
          </motion.div>
        )}
        
        {activeTab === 'settings' && (
          <motion.div
            key="settings"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            {/* Browser Notifications */}
            <ChannelSettings
              title="Browser Notifications"
              icon={<Globe size={16} />}
              enabled={channelConfig.browser.enabled}
              onToggle={async () => {
                if (!channelConfig.browser.enabled) {
                  const granted = await requestNotificationPermission();
                  if (!granted) {
                    alert('Please enable notifications in your browser settings');
                  }
                } else {
                  updateChannelConfig({
                    browser: { ...channelConfig.browser, enabled: false }
                  });
                }
              }}
              status={channelConfig.browser.permission}
            />
            
            {/* Telegram */}
            <ChannelSettings
              title="Telegram"
              icon={<Send size={16} />}
              enabled={channelConfig.telegram.enabled}
              onToggle={() => updateChannelConfig({
                telegram: { ...channelConfig.telegram, enabled: !channelConfig.telegram.enabled }
              })}
            >
              <div className="space-y-2 mt-2">
                <input
                  type="text"
                  placeholder="Bot Token"
                  value={channelConfig.telegram.botToken}
                  onChange={(e) => updateChannelConfig({
                    telegram: { ...channelConfig.telegram, botToken: e.target.value }
                  })}
                  className="w-full px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                />
                <input
                  type="text"
                  placeholder="Chat ID"
                  value={channelConfig.telegram.chatId}
                  onChange={(e) => updateChannelConfig({
                    telegram: { ...channelConfig.telegram, chatId: e.target.value }
                  })}
                  className="w-full px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                />
              </div>
            </ChannelSettings>
            
            {/* Discord */}
            <ChannelSettings
              title="Discord"
              icon={<MessageSquare size={16} />}
              enabled={channelConfig.discord.enabled}
              onToggle={() => updateChannelConfig({
                discord: { ...channelConfig.discord, enabled: !channelConfig.discord.enabled }
              })}
            >
              <div className="mt-2">
                <input
                  type="text"
                  placeholder="Webhook URL"
                  value={channelConfig.discord.webhookUrl}
                  onChange={(e) => updateChannelConfig({
                    discord: { ...channelConfig.discord, webhookUrl: e.target.value }
                  })}
                  className="w-full px-2 py-1 bg-cyber-darker border border-cyber-border rounded text-xs text-cyber-text"
                />
              </div>
            </ChannelSettings>
            
            {/* Email */}
            <ChannelSettings
              title="Email"
              icon={<Mail size={16} />}
              enabled={channelConfig.email.enabled}
              onToggle={() => updateChannelConfig({
                email: { ...channelConfig.email, enabled: !channelConfig.email.enabled }
              })}
              disabled
            >
              <p className="text-[10px] text-cyber-muted mt-2">
                Email notifications require backend setup (coming soon)
              </p>
            </ChannelSettings>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Create/Edit Modal */}
      <AnimatePresence>
        {(showCreate || editingAlert) && (
          <AlertFormModal
            alert={editingAlert}
            onSave={(alertData) => {
              if (editingAlert) {
                updateAlert(editingAlert.id, alertData);
              } else {
                addAlert(alertData as any);
              }
              setShowCreate(false);
              setEditingAlert(null);
            }}
            onClose={() => {
              setShowCreate(false);
              setEditingAlert(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

// Alert Card Component
function AlertCard({ 
  alert, 
  onToggle, 
  onEdit, 
  onDelete 
}: { 
  alert: Alert; 
  onToggle: () => void; 
  onEdit: () => void; 
  onDelete: () => void;
}) {
  const categoryIcons: Record<AlertCategory, React.ReactNode> = {
    price: <TrendingUp size={14} />,
    technical: <Activity size={14} />,
    volume: <Activity size={14} />,
    whale: <Zap size={14} />,
    liquidation: <AlertTriangle size={14} />,
    risk: <AlertTriangle size={14} />,
    sentiment: <MessageSquare size={14} />,
    news: <Globe size={14} />,
    signal: <Zap size={14} />,
    trade: <TrendingUp size={14} />,
  };
  
  return (
    <div className={`p-3 rounded border transition-all ${
      alert.enabled 
        ? 'bg-cyber-darker/50 border-cyber-border' 
        : 'bg-cyber-darker/30 border-cyber-border/50 opacity-60'
    }`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-2">
          <div className={`p-1.5 rounded ${
            alert.severity === 'critical' ? 'bg-cyber-red/20 text-cyber-red' :
            alert.severity === 'warning' ? 'bg-cyber-yellow/20 text-cyber-yellow' :
            'bg-cyber-cyan/20 text-cyber-cyan'
          }`}>
            {categoryIcons[alert.category]}
          </div>
          <div>
            <p className="text-sm text-cyber-text font-medium">{alert.name}</p>
            {alert.description && (
              <p className="text-[10px] text-cyber-muted">{alert.description}</p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-darker text-cyber-muted">
                {alert.category}
              </span>
              {alert.asset && (
                <span className="text-[10px] text-cyber-cyan">{alert.asset}</span>
              )}
              {alert.triggerCount > 0 && (
                <span className="text-[10px] text-cyber-muted">
                  Triggered {alert.triggerCount}x
                </span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          <button
            onClick={onToggle}
            className={`p-1 rounded ${
              alert.enabled ? 'text-cyber-green' : 'text-cyber-muted'
            }`}
          >
            {alert.enabled ? <Bell size={14} /> : <BellOff size={14} />}
          </button>
          <button onClick={onEdit} className="p-1 rounded text-cyber-muted hover:text-cyber-cyan">
            <Edit2 size={14} />
          </button>
          <button onClick={onDelete} className="p-1 rounded text-cyber-muted hover:text-cyber-red">
            <Trash2 size={14} />
          </button>
        </div>
      </div>
      
      {/* Channels */}
      <div className="flex items-center gap-1 mt-2">
        {alert.channels.map((channel) => (
          <span key={channel} className="text-[10px] px-1.5 py-0.5 rounded bg-cyber-border/50 text-cyber-muted">
            {channel}
          </span>
        ))}
      </div>
    </div>
  );
}

// Trigger Card Component
function TriggerCard({ 
  trigger, 
  onMarkRead, 
  onDismiss 
}: { 
  trigger: AlertTrigger; 
  onMarkRead: () => void; 
  onDismiss: () => void;
}) {
  if (trigger.dismissed) return null;
  
  return (
    <div className={`p-3 rounded border ${
      !trigger.read 
        ? 'bg-cyber-yellow/10 border-cyber-yellow/30' 
        : 'bg-cyber-darker/50 border-cyber-border'
    }`}>
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className={`text-xs font-medium ${
              trigger.severity === 'critical' ? 'text-cyber-red' :
              trigger.severity === 'warning' ? 'text-cyber-yellow' : 'text-cyber-cyan'
            }`}>
              {trigger.title}
            </span>
            {trigger.asset && (
              <span className="text-[10px] text-cyber-muted">{trigger.asset}</span>
            )}
          </div>
          <p className="text-xs text-cyber-text mt-1">{trigger.message}</p>
          <p className="text-[10px] text-cyber-muted mt-1">
            {new Date(trigger.timestamp).toLocaleString()}
          </p>
        </div>
        
        <div className="flex items-center gap-1">
          {!trigger.read && (
            <button 
              onClick={onMarkRead}
              className="p-1 rounded text-cyber-muted hover:text-cyber-green"
            >
              <Check size={14} />
            </button>
          )}
          <button 
            onClick={onDismiss}
            className="p-1 rounded text-cyber-muted hover:text-cyber-red"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}

// Channel Settings Component
function ChannelSettings({ 
  title, 
  icon, 
  enabled, 
  onToggle, 
  status, 
  disabled,
  children 
}: { 
  title: string; 
  icon: React.ReactNode; 
  enabled: boolean; 
  onToggle: () => void;
  status?: string;
  disabled?: boolean;
  children?: React.ReactNode;
}) {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <div className={`p-3 rounded border ${
      enabled ? 'bg-cyber-green/10 border-cyber-green/30' : 'bg-cyber-darker/50 border-cyber-border'
    } ${disabled ? 'opacity-50' : ''}`}>
      <div className="flex items-center justify-between">
        <div 
          className="flex items-center gap-2 cursor-pointer flex-1"
          onClick={() => setExpanded(!expanded)}
        >
          <div className={enabled ? 'text-cyber-green' : 'text-cyber-muted'}>
            {icon}
          </div>
          <span className="text-sm text-cyber-text">{title}</span>
          {status && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              status === 'granted' ? 'bg-cyber-green/20 text-cyber-green' :
              status === 'denied' ? 'bg-cyber-red/20 text-cyber-red' :
              'bg-cyber-yellow/20 text-cyber-yellow'
            }`}>
              {status}
            </span>
          )}
          {children && (
            expanded ? <ChevronDown size={14} className="text-cyber-muted" /> : 
                       <ChevronRight size={14} className="text-cyber-muted" />
          )}
        </div>
        <button
          onClick={onToggle}
          disabled={disabled}
          className={`w-10 h-5 rounded-full transition-all ${
            enabled ? 'bg-cyber-green' : 'bg-cyber-border'
          }`}
        >
          <div className={`w-4 h-4 rounded-full bg-white transition-all ${
            enabled ? 'translate-x-5' : 'translate-x-0.5'
          }`} />
        </button>
      </div>
      
      {expanded && children && (
        <div className="mt-2">{children}</div>
      )}
    </div>
  );
}

// Alert Form Modal
function AlertFormModal({ 
  alert, 
  onSave, 
  onClose 
}: { 
  alert: Alert | null; 
  onSave: (data: Partial<Alert>) => void; 
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    name: alert?.name || '',
    description: alert?.description || '',
    category: alert?.category || 'price' as AlertCategory,
    asset: alert?.asset || 'XRP',
    indicator: alert?.indicator || 'price',
    conditionType: alert?.condition.type || 'above' as any,
    conditionValue: alert?.condition.value || 0,
    channels: alert?.channels || ['in_app'] as AlertChannel[],
    severity: alert?.severity || 'info' as any,
    cooldownMinutes: alert?.cooldownMinutes || 60,
    enabled: alert?.enabled ?? true,
  });
  
  const categories: AlertCategory[] = ['price', 'technical', 'volume', 'whale', 'liquidation', 'risk', 'sentiment', 'signal'];
  const conditionTypes = ['above', 'below', 'crosses_above', 'crosses_below', 'change_percent'];
  const severities = ['info', 'warning', 'critical'];
  const channels: AlertChannel[] = ['in_app', 'browser', 'telegram', 'discord'];
  
  const handleSubmit = () => {
    onSave({
      name: formData.name,
      description: formData.description,
      category: formData.category,
      asset: formData.asset,
      indicator: formData.indicator,
      condition: {
        type: formData.conditionType,
        value: formData.conditionValue,
      },
      channels: formData.channels,
      severity: formData.severity,
      cooldownMinutes: formData.cooldownMinutes,
      enabled: formData.enabled,
    });
  };
  
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="cyber-panel p-4 w-full max-w-md max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-cyber-border">
          <span className="font-cyber text-sm text-cyber-yellow">
            {alert ? 'EDIT ALERT' : 'CREATE ALERT'}
          </span>
          <button onClick={onClose} className="text-cyber-muted hover:text-cyber-text">
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-4">
          {/* Name */}
          <div>
            <label className="text-xs text-cyber-muted">Alert Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              placeholder="My Alert"
            />
          </div>
          
          {/* Category & Asset */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Category</label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value as AlertCategory })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Asset</label>
              <input
                type="text"
                value={formData.asset}
                onChange={(e) => setFormData({ ...formData, asset: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
                placeholder="XRP"
              />
            </div>
          </div>
          
          {/* Condition */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Condition</label>
              <select
                value={formData.conditionType}
                onChange={(e) => setFormData({ ...formData, conditionType: e.target.value })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              >
                {conditionTypes.map(type => (
                  <option key={type} value={type}>{type.replace('_', ' ')}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Value</label>
              <input
                type="number"
                value={formData.conditionValue}
                onChange={(e) => setFormData({ ...formData, conditionValue: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              />
            </div>
          </div>
          
          {/* Severity & Cooldown */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-cyber-muted">Severity</label>
              <select
                value={formData.severity}
                onChange={(e) => setFormData({ ...formData, severity: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              >
                {severities.map(sev => (
                  <option key={sev} value={sev}>{sev}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs text-cyber-muted">Cooldown (min)</label>
              <input
                type="number"
                value={formData.cooldownMinutes}
                onChange={(e) => setFormData({ ...formData, cooldownMinutes: Number(e.target.value) })}
                className="w-full mt-1 px-3 py-2 bg-cyber-darker border border-cyber-border rounded text-sm text-cyber-text"
              />
            </div>
          </div>
          
          {/* Channels */}
          <div>
            <label className="text-xs text-cyber-muted">Delivery Channels</label>
            <div className="flex flex-wrap gap-2 mt-2">
              {channels.map(channel => (
                <button
                  key={channel}
                  onClick={() => {
                    const newChannels = formData.channels.includes(channel)
                      ? formData.channels.filter(c => c !== channel)
                      : [...formData.channels, channel];
                    setFormData({ ...formData, channels: newChannels });
                  }}
                  className={`px-3 py-1 rounded text-xs ${
                    formData.channels.includes(channel)
                      ? 'bg-cyber-cyan/20 text-cyber-cyan border border-cyber-cyan/50'
                      : 'bg-cyber-darker text-cyber-muted border border-cyber-border'
                  }`}
                >
                  {channel}
                </button>
              ))}
            </div>
          </div>
          
          {/* Actions */}
          <div className="flex items-center gap-3 pt-4 border-t border-cyber-border">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2 rounded border border-cyber-border text-cyber-muted hover:text-cyber-text transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formData.name}
              className="flex-1 px-4 py-2 rounded bg-cyber-yellow/20 border border-cyber-yellow/50 text-cyber-yellow hover:bg-cyber-yellow/30 transition-all disabled:opacity-50"
            >
              {alert ? 'Update' : 'Create'}
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default AlertBuilder;
