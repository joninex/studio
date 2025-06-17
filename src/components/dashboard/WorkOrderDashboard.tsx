
"use client"; // Added "use client" as it uses React hooks (useState, useEffect implicit)

import React, { useState, useEffect } from 'react'; // Added useEffect for completeness, though not explicitly used in static version
import { 
  Search, 
  Plus, 
  Filter, 
  Bell, 
  User, 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Wrench,
  Calendar,
  DollarSign,
  MoreHorizontal,
  Phone,
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';

const WorkOrderDashboard = () => {
  const [selectedFilter, setSelectedFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState(3);

  // Datos de ejemplo para órdenes de trabajo
  const workOrders = [
    {
      id: 'WO-2024-001',
      client: 'María González',
      device: 'iPhone 15 Pro',
      issue: 'Pantalla rota',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Carlos Ruiz',
      createdDate: '2024-06-15',
      dueDate: '2024-06-18',
      cost: '$180.00',
      icon: Smartphone
    },
    {
      id: 'WO-2024-002',
      client: 'Pedro Martínez',
      device: 'MacBook Air M2',
      issue: 'No enciende',
      status: 'pending',
      priority: 'medium',
      assignedTo: 'Ana López',
      createdDate: '2024-06-16',
      dueDate: '2024-06-20',
      cost: '$250.00',
      icon: Monitor
    },
    {
      id: 'WO-2024-003',
      client: 'Laura Silva',
      device: 'Samsung Galaxy Tab',
      issue: 'Batería defectuosa',
      status: 'completed',
      priority: 'low',
      assignedTo: 'Miguel Torres',
      createdDate: '2024-06-14',
      dueDate: '2024-06-17',
      cost: '$120.00',
      icon: Tablet
    },
    {
      id: 'WO-2024-004',
      client: 'Roberto Chen',
      device: 'iPhone 14',
      issue: 'Puerto de carga dañado',
      status: 'in-progress',
      priority: 'high',
      assignedTo: 'Carlos Ruiz',
      createdDate: '2024-06-16',
      dueDate: '2024-06-19',
      cost: '$95.00',
      icon: Smartphone
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-emerald-600 bg-emerald-50';
      case 'in-progress': return 'text-blue-600 bg-blue-50';
      case 'pending': return 'text-amber-600 bg-amber-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircle2;
      case 'in-progress': return Clock;
      case 'pending': return AlertCircle;
      default: return Clock;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-400';
      case 'medium': return 'border-l-yellow-400';
      case 'low': return 'border-l-green-400';
      default: return 'border-l-gray-400';
    }
  };

  const filteredOrders = workOrders.filter(order => {
    const matchesFilter = selectedFilter === 'all' || order.status === selectedFilter;
    const matchesSearch = order.client.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.device.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.id.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-8">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wrench className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-semibold text-gray-900">StudioRepair</h1>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Bell className="w-5 h-5 text-gray-500 hover:text-gray-700 cursor-pointer transition-colors" />
                {notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                    {notifications}
                  </span>
                )}
              </div>
              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600" />
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Page Title and Action */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Órdenes de Trabajo</h2>
            <p className="text-gray-600 mt-1">Gestiona y supervisa todas las reparaciones</p>
          </div>
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors">
            <Plus className="w-4 h-4" />
            <span>Nueva Orden</span>
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Órdenes</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">24</p>
              </div>
              <div className="w-12 h-12 bg-blue-50 rounded-lg flex items-center justify-center">
                <Wrench className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">En Progreso</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">8</p>
              </div>
              <div className="w-12 h-12 bg-amber-50 rounded-lg flex items-center justify-center">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Completadas</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">12</p>
              </div>
              <div className="w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-xl p-6 border border-gray-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ingresos</p>
                <p className="text-2xl font-semibold text-gray-900 mt-1">$2,450</p>
              </div>
              <div className="w-12 h-12 bg-green-50 rounded-lg flex items-center justify-center">
                <DollarSign className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="bg-white rounded-xl border border-gray-200 p-6 mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar órdenes..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setSelectedFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Todas
              </button>
              <button
                onClick={() => setSelectedFilter('pending')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'pending' 
                    ? 'bg-amber-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Pendientes
              </button>
              <button
                onClick={() => setSelectedFilter('in-progress')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'in-progress' 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                En Progreso
              </button>
              <button
                onClick={() => setSelectedFilter('completed')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  selectedFilter === 'completed' 
                    ? 'bg-emerald-600 text-white' 
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Completadas
              </button>
            </div>
          </div>
        </div>

        {/* Work Orders List */}
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const StatusIcon = getStatusIcon(order.status);
            const DeviceIcon = order.icon;
            
            return (
              <div 
                key={order.id} 
                className={`bg-white rounded-xl border-l-4 ${getPriorityColor(order.priority)} border-r border-t border-b border-gray-200 p-6 hover:shadow-md transition-shadow cursor-pointer`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-gray-50 rounded-lg flex items-center justify-center">
                      <DeviceIcon className="w-6 h-6 text-gray-600" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="text-lg font-medium text-gray-900">{order.id}</h3>
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {order.status === 'in-progress' ? 'En Progreso' : 
                           order.status === 'completed' ? 'Completada' : 'Pendiente'}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                        <div>
                          <span className="font-medium">Cliente:</span> {order.client}
                        </div>
                        <div>
                          <span className="font-medium">Dispositivo:</span> {order.device}
                        </div>
                        <div>
                          <span className="font-medium">Problema:</span> {order.issue}
                        </div>
                        <div>
                          <span className="font-medium">Técnico:</span> {order.assignedTo}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                        <div className="flex items-center space-x-1">
                          <Calendar className="w-4 h-4" />
                          <span>Vence: {order.dueDate}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4" />
                          <span>{order.cost}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                    <MoreHorizontal className="w-5 h-5 text-gray-400" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {filteredOrders.length === 0 && (
          <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
            <Search className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No se encontraron órdenes</h3>
            <p className="text-gray-600">Intenta ajustar los filtros o términos de búsqueda</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default WorkOrderDashboard;
