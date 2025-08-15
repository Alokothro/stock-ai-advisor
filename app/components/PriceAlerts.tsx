'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, BellOff, Plus, Trash2, Edit2, TrendingUp, 
  TrendingDown, Target, AlertTriangle, Check, X
} from 'lucide-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '@/amplify/data/resource';
import { AlertsSkeleton } from './LoadingSkeletons';

const client = generateClient<Schema>();

interface Alert {
  id: string;
  symbol: string;
  condition: 'ABOVE' | 'BELOW' | 'CHANGE_PERCENT';
  targetValue: number;
  isActive: boolean;
  createdAt: string;
  triggeredAt?: string;
  currentPrice?: number;
  notes?: string;
}

interface PriceAlertsProps {
  symbol?: string;
  onAlertTriggered?: (alert: Alert) => void;
}

export default function PriceAlerts({ symbol, onAlertTriggered }: PriceAlertsProps) {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingAlert, setEditingAlert] = useState<Alert | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [newAlert, setNewAlert] = useState({
    symbol: symbol || '',
    condition: 'ABOVE' as Alert['condition'],
    targetValue: 0,
    notes: ''
  });

  useEffect(() => {
    fetchAlerts();
    // Check alerts every 30 seconds
    const interval = setInterval(checkAlerts, 30000);
    return () => clearInterval(interval);
  }, [symbol]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await client.models.Alert.list({
        filter: symbol ? { symbol: { eq: symbol } } : undefined
      });
      
      const alertData = response.data?.map(alert => ({
        id: alert.id,
        symbol: alert.symbol,
        condition: alert.condition as Alert['condition'],
        targetValue: alert.targetValue || 0,
        isActive: alert.isActive ?? true,
        createdAt: alert.createdAt || new Date().toISOString(),
        triggeredAt: alert.triggeredAt,
        notes: alert.notes
      })) || [];
      
      setAlerts(alertData);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      // Load mock data
      loadMockAlerts();
    } finally {
      setLoading(false);
    }
  };

  const loadMockAlerts = () => {
    const mockAlerts: Alert[] = [
      {
        id: '1',
        symbol: 'AAPL',
        condition: 'ABOVE',
        targetValue: 200,
        isActive: true,
        createdAt: new Date().toISOString(),
        currentPrice: 195,
        notes: 'Potential breakout level'
      },
      {
        id: '2',
        symbol: 'MSFT',
        condition: 'BELOW',
        targetValue: 350,
        isActive: true,
        createdAt: new Date().toISOString(),
        currentPrice: 360,
        notes: 'Buy opportunity'
      },
      {
        id: '3',
        symbol: 'GOOGL',
        condition: 'CHANGE_PERCENT',
        targetValue: 5,
        isActive: true,
        createdAt: new Date().toISOString(),
        currentPrice: 2800,
        notes: 'Volatility alert'
      }
    ];
    
    if (symbol) {
      setAlerts(mockAlerts.filter(a => a.symbol === symbol));
    } else {
      setAlerts(mockAlerts);
    }
  };

  const checkAlerts = async () => {
    // In production, this would check current prices against alert conditions
    // and trigger notifications when conditions are met
    for (const alert of alerts) {
      if (!alert.isActive || alert.triggeredAt) continue;
      
      // Mock price check
      const currentPrice = alert.currentPrice || 100;
      let triggered = false;
      
      switch (alert.condition) {
        case 'ABOVE':
          triggered = currentPrice >= alert.targetValue;
          break;
        case 'BELOW':
          triggered = currentPrice <= alert.targetValue;
          break;
        case 'CHANGE_PERCENT':
          // Would calculate percent change from open price
          triggered = false;
          break;
      }
      
      if (triggered) {
        // Update alert as triggered
        const updatedAlert = { ...alert, triggeredAt: new Date().toISOString() };
        onAlertTriggered?.(updatedAlert);
        
        // Show notification
        showNotification(updatedAlert);
      }
    }
  };

  const showNotification = (alert: Alert) => {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(`Price Alert: ${alert.symbol}`, {
        body: `${alert.symbol} has ${alert.condition === 'ABOVE' ? 'risen above' : 'fallen below'} $${alert.targetValue}`,
        icon: '/icon.png'
      });
    }
  };

  const handleCreateAlert = async () => {
    try {
      const alert = await client.models.Alert.create({
        symbol: newAlert.symbol,
        condition: newAlert.condition,
        targetValue: newAlert.targetValue,
        isActive: true,
        notes: newAlert.notes,
        userId: 'current-user'
      });
      
      await fetchAlerts();
      setShowAddModal(false);
      setNewAlert({
        symbol: symbol || '',
        condition: 'ABOVE',
        targetValue: 0,
        notes: ''
      });
    } catch (error) {
      console.error('Error creating alert:', error);
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      await client.models.Alert.delete({ id: alertId });
      await fetchAlerts();
    } catch (error) {
      console.error('Error deleting alert:', error);
    }
  };

  const handleToggleAlert = async (alert: Alert) => {
    try {
      await client.models.Alert.update({
        id: alert.id,
        isActive: !alert.isActive
      });
      await fetchAlerts();
    } catch (error) {
      console.error('Error toggling alert:', error);
    }
  };

  const getConditionIcon = (condition: Alert['condition']) => {
    switch (condition) {
      case 'ABOVE':
        return <TrendingUp className="w-4 h-4 text-green-500" />;
      case 'BELOW':
        return <TrendingDown className="w-4 h-4 text-red-500" />;
      case 'CHANGE_PERCENT':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
    }
  };

  const getConditionText = (condition: Alert['condition']) => {
    switch (condition) {
      case 'ABOVE':
        return 'rises above';
      case 'BELOW':
        return 'falls below';
      case 'CHANGE_PERCENT':
        return 'changes by';
    }
  };

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  if (loading) {
    return <AlertsSkeleton />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              Price Alerts
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Get notified when prices reach your targets
            </p>
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Alert
          </button>
        </div>

        {/* Active Alerts Count */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Active Alerts</p>
            <p className="text-2xl font-bold text-blue-600">
              {alerts.filter(a => a.isActive).length}
            </p>
          </div>
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Triggered Today</p>
            <p className="text-2xl font-bold text-green-600">
              {alerts.filter(a => a.triggeredAt && new Date(a.triggeredAt).toDateString() === new Date().toDateString()).length}
            </p>
          </div>
          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">Total Alerts</p>
            <p className="text-2xl font-bold text-purple-600">
              {alerts.length}
            </p>
          </div>
        </div>

        {/* Alerts List */}
        <div className="space-y-3">
          {alerts.length === 0 ? (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              No price alerts set. Create your first alert to get started.
            </div>
          ) : (
            alerts.map((alert) => (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className={`bg-gray-50 dark:bg-gray-700 rounded-lg p-4 ${
                  !alert.isActive ? 'opacity-50' : ''
                } ${alert.triggeredAt ? 'border-l-4 border-green-500' : ''}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={() => handleToggleAlert(alert)}
                      className="p-2 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                    >
                      {alert.isActive ? (
                        <Bell className="w-5 h-5 text-blue-500" />
                      ) : (
                        <BellOff className="w-5 h-5 text-gray-400" />
                      )}
                    </button>
                    
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className="font-semibold text-gray-900 dark:text-white">
                          {alert.symbol}
                        </span>
                        {getConditionIcon(alert.condition)}
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {getConditionText(alert.condition)}
                        </span>
                        <span className="font-semibold text-gray-900 dark:text-white">
                          ${alert.targetValue}
                          {alert.condition === 'CHANGE_PERCENT' && '%'}
                        </span>
                      </div>
                      {alert.notes && (
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {alert.notes}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500 dark:text-gray-400">
                        <span>Created: {new Date(alert.createdAt).toLocaleDateString()}</span>
                        {alert.currentPrice && (
                          <span>Current: ${alert.currentPrice}</span>
                        )}
                        {alert.triggeredAt && (
                          <span className="text-green-500 flex items-center">
                            <Check className="w-3 h-3 mr-1" />
                            Triggered: {new Date(alert.triggeredAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setEditingAlert(alert)}
                      className="p-2 text-blue-600 hover:bg-blue-100 dark:hover:bg-blue-900/20 rounded-lg transition-colors"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteAlert(alert.id)}
                      className="p-2 text-red-600 hover:bg-red-100 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Add/Edit Alert Modal */}
      <AnimatePresence>
        {(showAddModal || editingAlert) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
            onClick={() => {
              setShowAddModal(false);
              setEditingAlert(null);
            }}
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
                {editingAlert ? 'Edit Alert' : 'Create Price Alert'}
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Symbol
                  </label>
                  <input
                    type="text"
                    value={editingAlert?.symbol || newAlert.symbol}
                    onChange={(e) => setNewAlert({ ...newAlert, symbol: e.target.value.toUpperCase() })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="AAPL"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condition
                  </label>
                  <select
                    value={editingAlert?.condition || newAlert.condition}
                    onChange={(e) => setNewAlert({ ...newAlert, condition: e.target.value as Alert['condition'] })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                  >
                    <option value="ABOVE">Price rises above</option>
                    <option value="BELOW">Price falls below</option>
                    <option value="CHANGE_PERCENT">Price changes by %</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Target Value
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingAlert?.targetValue || newAlert.targetValue}
                    onChange={(e) => setNewAlert({ ...newAlert, targetValue: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    placeholder="100.00"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    value={editingAlert?.notes || newAlert.notes}
                    onChange={(e) => setNewAlert({ ...newAlert, notes: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    rows={2}
                    placeholder="Add notes about this alert..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAlert(null);
                  }}
                  className="px-4 py-2 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateAlert}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                >
                  {editingAlert ? 'Update' : 'Create'} Alert
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}