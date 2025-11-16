import { useState } from 'react';
import { Play, Clock, Users, Star, ChevronRight, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Tutorial {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: 'getting-started' | 'manufacturer' | 'distributor' | 'pharmacy' | 'verification';
  thumbnail: string;
  videoUrl: string;
  transcript?: string;
  relatedTopics: string[];
  rating: number;
  views: number;
}

const tutorials: Tutorial[] = [
  {
    id: 'wallet-setup',
    title: 'Setting Up Your Wallet',
    description: 'Learn how to install and configure MetaMask for Red Médica',
    duration: '3:45',
    difficulty: 'Beginner',
    category: 'getting-started',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-wallet-setup',
    transcript: 'In this tutorial, we\'ll walk through setting up MetaMask...',
    relatedTopics: ['Blockchain Basics', 'Security Best Practices'],
    rating: 4.8,
    views: 1250,
  },
  {
    id: 'product-registration',
    title: 'Registering Your First Product',
    description: 'Complete guide to registering pharmaceutical products on the blockchain',
    duration: '6:20',
    difficulty: 'Beginner',
    category: 'manufacturer',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-product-registration',
    transcript: 'Welcome to the product registration tutorial...',
    relatedTopics: ['QR Code Generation', 'Batch Management'],
    rating: 4.9,
    views: 980,
  },
  {
    id: 'qr-generation',
    title: 'Generating and Managing QR Codes',
    description: 'How to create, customize, and print QR codes for your products',
    duration: '4:15',
    difficulty: 'Intermediate',
    category: 'manufacturer',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-qr-codes',
    transcript: 'QR codes are the bridge between physical products and digital records...',
    relatedTopics: ['Product Registration', 'Printing Labels'],
    rating: 4.7,
    views: 756,
  },
  {
    id: 'custody-transfer',
    title: 'Transferring Product Custody',
    description: 'Learn the custody transfer process for distributors and pharmacies',
    duration: '5:30',
    difficulty: 'Intermediate',
    category: 'distributor',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-custody-transfer',
    transcript: 'Custody transfers are critical for maintaining supply chain integrity...',
    relatedTopics: ['Supply Chain Tracking', 'Authorization'],
    rating: 4.6,
    views: 642,
  },
  {
    id: 'product-verification',
    title: 'Verifying Product Authenticity',
    description: 'How patients and healthcare providers can verify medications',
    duration: '2:50',
    difficulty: 'Beginner',
    category: 'verification',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-verification',
    transcript: 'Product verification is simple and takes just seconds...',
    relatedTopics: ['QR Scanning', 'Counterfeit Detection'],
    rating: 4.9,
    views: 1420,
  },
  {
    id: 'pharmacy-workflow',
    title: 'Pharmacy Management Workflow',
    description: 'Complete workflow for pharmacies from receiving to dispensing',
    duration: '8:45',
    difficulty: 'Advanced',
    category: 'pharmacy',
    thumbnail: '/api/placeholder/320/180',
    videoUrl: 'https://www.youtube.com/embed/demo-pharmacy-workflow',
    transcript: 'Pharmacies play a crucial role in the final verification...',
    relatedTopics: ['Inventory Management', 'Patient Safety'],
    rating: 4.8,
    views: 534,
  },
];

const categories = [
  { id: 'getting-started', label: 'Getting Started', icon: '🚀' },
  { id: 'manufacturer', label: 'Manufacturer', icon: '🏭' },
  { id: 'distributor', label: 'Distributor', icon: '🚚' },
  { id: 'pharmacy', label: 'Pharmacy', icon: '💊' },
  { id: 'verification', label: 'Verification', icon: '✅' },
];

export const VideoTutorials = () => {
  const [selectedCategory, setSelectedCategory] = useState('getting-started');
  const [selectedTutorial, setSelectedTutorial] = useState<Tutorial | null>(null);

  const filteredTutorials = tutorials.filter(
    tutorial => tutorial.category === selectedCategory
  );

  const getDifficultyColor = (difficulty: Tutorial['difficulty']) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'Advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`h-3 w-3 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  if (selectedTutorial) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            onClick={() => setSelectedTutorial(null)}
            className="text-blue-600 hover:text-blue-700"
          >
            ← Back to Tutorials
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Video Player */}
          <div className="lg:col-span-2">
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-gray-900 rounded-t-lg flex items-center justify-center">
                  <div className="text-center text-white">
                    <Play className="h-16 w-16 mx-auto mb-4 opacity-70" />
                    <p className="text-lg font-semibold">{selectedTutorial.title}</p>
                    <p className="text-sm opacity-70">Video Player Placeholder</p>
                    <p className="text-xs mt-2 opacity-50">
                      In production, this would embed: {selectedTutorial.videoUrl}
                    </p>
                  </div>
                </div>
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-2xl font-bold">{selectedTutorial.title}</h2>
                    <Badge className={getDifficultyColor(selectedTutorial.difficulty)}>
                      {selectedTutorial.difficulty}
                    </Badge>
                  </div>
                  <p className="text-gray-600 mb-4">{selectedTutorial.description}</p>
                  
                  <div className="flex items-center gap-4 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {selectedTutorial.duration}
                    </div>
                    <div className="flex items-center gap-1">
                      <Users className="h-4 w-4" />
                      {selectedTutorial.views.toLocaleString()} views
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(selectedTutorial.rating)}
                      <span className="ml-1">{selectedTutorial.rating}</span>
                    </div>
                  </div>

                  {selectedTutorial.transcript && (
                    <div className="border-t pt-4">
                      <h3 className="font-semibold mb-2">Transcript</h3>
                      <p className="text-sm text-gray-600">{selectedTutorial.transcript}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Related Topics */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Related Topics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {selectedTutorial.relatedTopics.map((topic, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors"
                  >
                    <span className="text-sm">{topic}</span>
                    <ChevronRight className="h-4 w-4 text-gray-400" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* More Tutorials */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">More Tutorials</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {tutorials
                  .filter(t => t.id !== selectedTutorial.id)
                  .slice(0, 3)
                  .map((tutorial) => (
                    <div
                      key={tutorial.id}
                      className="flex gap-3 p-2 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => setSelectedTutorial(tutorial)}
                    >
                      <div className="w-16 h-12 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                        <Play className="h-4 w-4 text-gray-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{tutorial.title}</p>
                        <p className="text-xs text-gray-500">{tutorial.duration}</p>
                      </div>
                    </div>
                  ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-2">Video Tutorials</h2>
        <p className="text-gray-600">Learn Red Médica with step-by-step video guides</p>
      </div>

      <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
        <TabsList className="grid w-full grid-cols-5">
          {categories.map((category) => (
            <TabsTrigger key={category.id} value={category.id} className="text-xs">
              <span className="mr-1">{category.icon}</span>
              {category.label}
            </TabsTrigger>
          ))}
        </TabsList>

        {categories.map((category) => (
          <TabsContent key={category.id} value={category.id} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredTutorials.map((tutorial) => (
                <Card
                  key={tutorial.id}
                  className="group cursor-pointer hover:shadow-lg transition-all duration-300"
                  onClick={() => setSelectedTutorial(tutorial)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-video bg-gray-200 rounded-t-lg relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="bg-white/20 backdrop-blur-sm rounded-full p-3 group-hover:bg-white/30 transition-colors">
                          <Play className="h-6 w-6 text-white" />
                        </div>
                      </div>
                      <div className="absolute bottom-2 right-2">
                        <Badge variant="secondary" className="text-xs">
                          {tutorial.duration}
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-sm line-clamp-2 flex-1">
                          {tutorial.title}
                        </h3>
                        <Badge className={`ml-2 text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                          {tutorial.difficulty}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-600 line-clamp-2 mb-3">
                        {tutorial.description}
                      </p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {tutorial.views.toLocaleString()}
                        </div>
                        <div className="flex items-center gap-1">
                          {renderStars(tutorial.rating)}
                          <span className="ml-1">{tutorial.rating}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {filteredTutorials.length === 0 && (
              <div className="text-center py-12">
                <div className="text-gray-400 mb-4">
                  <Play className="h-12 w-12 mx-auto" />
                </div>
                <h3 className="text-lg font-semibold text-gray-600 mb-2">
                  No tutorials available
                </h3>
                <p className="text-gray-500">
                  Tutorials for this category are coming soon.
                </p>
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>

      {/* Quick Links */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-semibold">Documentation</div>
                <div className="text-sm text-gray-600">Complete user guide</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-semibold">API Reference</div>
                <div className="text-sm text-gray-600">Developer resources</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
            <Button variant="outline" className="justify-start h-auto p-4">
              <div className="text-left">
                <div className="font-semibold">Community</div>
                <div className="text-sm text-gray-600">Join our Discord</div>
              </div>
              <ExternalLink className="h-4 w-4 ml-auto" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};