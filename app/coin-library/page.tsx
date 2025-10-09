'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/UI/Card';
import { Button } from '@/components/UI/button';
import { Input } from '@/components/UI/input';
import { Badge } from '@/components/UI/badge';
import { toast } from 'sonner';

interface CoinTemplate {
  id: number;
  name: string;
  symbol: string;
  description: string;
  image: string;
  category: string;
  supply: number;
  decimals: number;
  tags: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

export default function CoinLibraryPage() {
  const [templates, setTemplates] = useState<CoinTemplate[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedTemplate, setSelectedTemplate] = useState<CoinTemplate | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [categories, setCategories] = useState<string[]>(['All']);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/coin-library');
      const result = await response.json();
      
      if (result.success) {
        setTemplates(result.templates);
        // Extract unique categories
        const uniqueCategories = ['All', ...Array.from(new Set(result.templates.map((t: CoinTemplate) => t.category)))];
        setCategories(uniqueCategories);
      } else {
        toast.error('Failed to fetch templates');
      }
    } catch (error) {
      console.error('Error fetching templates:', error);
      toast.error('Failed to fetch templates');
    } finally {
      setIsLoading(false);
    }
  };

  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleUseTemplate = (template: CoinTemplate) => {
    // TODO: Navigate to coin creation page with pre-filled data
    toast.success(`Using template: ${template.name}`);
    setSelectedTemplate(template);
  };

  const handleCustomizeTemplate = (template: CoinTemplate) => {
    // TODO: Navigate to coin creation page with template data for editing
    toast.success(`Customizing template: ${template.name}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-zinc-100">Coin Library</h1>
          <p className="text-zinc-400 mt-2">Browse and use pre-made memecoin templates</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-zinc-800 border-zinc-700 text-zinc-100"
          />
        </div>
        <div className="flex gap-2">
          {categories.map(category => (
            <Button
              key={category}
              variant={selectedCategory === category ? "default" : "outline"}
              onClick={() => setSelectedCategory(category)}
              className={selectedCategory === category ? "bg-blue-600 hover:bg-blue-700" : "border-zinc-700 text-zinc-300 hover:bg-zinc-800"}
            >
              {category}
            </Button>
          ))}
        </div>
      </div>

      {/* Templates Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <div className="col-span-full text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="text-zinc-400 mt-4">Loading templates...</p>
          </div>
        ) : (
          filteredTemplates.map(template => (
          <Card key={template.id} className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-zinc-100 text-lg">{template.name}</CardTitle>
                  <CardDescription className="text-zinc-400">{template.symbol}</CardDescription>
                </div>
                <Badge variant="secondary" className="bg-zinc-800 text-zinc-300">
                  {template.category}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="w-full h-32 bg-zinc-800 rounded-lg flex items-center justify-center">
                <img 
                  src={template.image} 
                  alt={template.name}
                  className="max-w-full max-h-full object-contain rounded-lg"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
              
              <p className="text-sm text-zinc-300">{template.description}</p>
              
              <div className="flex flex-wrap gap-1">
                {template.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs border-zinc-700 text-zinc-400">
                    {tag}
                  </Badge>
                ))}
              </div>

              <div className="text-xs text-zinc-500 space-y-1">
                <p>Supply: {template.supply.toLocaleString()}</p>
                <p>Decimals: {template.decimals}</p>
              </div>

              <div className="flex gap-2">
                <Button 
                  onClick={() => handleUseTemplate(template)}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                >
                  Use Template
                </Button>
                <Button 
                  onClick={() => handleCustomizeTemplate(template)}
                  variant="outline"
                  className="border-zinc-700 text-zinc-300 hover:bg-zinc-800"
                >
                  Customize
                </Button>
              </div>
            </CardContent>
          </Card>
          ))
        )}
      </div>

      {!isLoading && filteredTemplates.length === 0 && (
        <div className="text-center py-12">
          <p className="text-zinc-400">No templates found matching your criteria.</p>
        </div>
      )}

      {/* Selected Template Preview */}
      {selectedTemplate && (
        <Card className="bg-zinc-900/50 border-zinc-800">
          <CardHeader>
            <CardTitle className="text-zinc-100">Selected Template</CardTitle>
            <CardDescription className="text-zinc-400">
              Ready to use: {selectedTemplate.name}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-zinc-800 rounded-lg flex items-center justify-center">
                  <img 
                    src={selectedTemplate.image} 
                    alt={selectedTemplate.name}
                    className="max-w-full max-h-full object-contain rounded-lg"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-zinc-100">{selectedTemplate.name}</h3>
                  <p className="text-zinc-400">{selectedTemplate.symbol}</p>
                </div>
              </div>
              <Button 
                onClick={() => {
                  // TODO: Navigate to coin creation with template data
                  toast.success('Redirecting to coin creation...');
                }}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                Create This Token
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
