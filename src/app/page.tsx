'use client';

import React, { useState, useEffect } from 'react';
import { Search, Plus, Calendar, User, FileText } from 'lucide-react';
import { GraphListItem } from '@/types/graph';

export default function HomePage() {
  const [graphs, setGraphs] = useState<GraphListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedProvider, setSelectedProvider] = useState('');
  const [providers, setProviders] = useState<string[]>([]);

  const fetchGraphs = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (searchTerm) params.append('search', searchTerm);
      if (selectedProvider) params.append('provider', selectedProvider);
      
      const response = await fetch(`/api/graphs?${params}`);
      const data = await response.json();
      
      if (response.ok) {
        setGraphs(data.graphs || []);
        
        // Extract unique providers
        const uniqueProviders = Array.from(
          new Set(data.graphs.map((g: GraphListItem) => g.metadata.provider))
        ) as string[];
        setProviders(uniqueProviders);
      }
    } catch (error) {
      console.error('Error fetching graphs:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGraphs();
  }, [searchTerm, selectedProvider]);

  const handleCreateGraph = () => {
    // For now, just redirect to a basic explorer
    window.location.href = '/explorer';
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Knowledge Graphs</h1>
          <p className="mt-2 text-gray-600">
            Explore and analyze semiconductor industry knowledge graphs
          </p>
        </div>
        <button
          onClick={handleCreateGraph}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create Graph
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow mb-6 p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search graphs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* Provider Filter */}
          <div>
            <select
              value={selectedProvider}
              onChange={(e) => setSelectedProvider(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Providers</option>
              {providers.map((provider) => (
                <option key={provider} value={provider}>
                  {provider}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Graph Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : graphs.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No graphs found</h3>
          <p className="mt-1 text-sm text-gray-500">
            Get started by creating a new knowledge graph.
          </p>
          <div className="mt-6">
            <button
              onClick={handleCreateGraph}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Graph
            </button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {graphs.map((graph) => (
            <div
              key={graph._id}
              className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => window.location.href = `/explorer?graph=${graph._id}`}
            >
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <h3 className="text-lg font-medium text-gray-900 truncate">
                    {graph.title}
                  </h3>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {graph.metadata.provider}
                  </span>
                </div>
                
                <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                  {graph.description || 'No description available'}
                </p>

                <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                  <div className="flex items-center">
                    <div className="flex items-center mr-4">
                      <div className="w-2 h-2 bg-blue-400 rounded-full mr-1"></div>
                      <span>{graph.nodeCount} nodes</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-green-400 rounded-full mr-1"></div>
                      <span>{graph.edgeCount} edges</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <div className="flex items-center">
                    <User className="w-3 h-3 mr-1" />
                    <span>{graph.createdBy}</span>
                  </div>
                  <div className="flex items-center">
                    <Calendar className="w-3 h-3 mr-1" />
                    <span>{new Date(graph.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
