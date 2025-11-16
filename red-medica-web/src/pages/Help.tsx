import { useState } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Search, BookOpen, MessageCircle, Mail, Play, Video, HelpCircle, Settings, Users, FileText, Lightbulb } from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { VideoTutorials } from '@/components/VideoTutorials';
import { HelpTooltip } from '@/components/HelpTooltip';
import { useAppStore } from '@/lib/store';
import { useOnboarding } from '@/components/OnboardingFlow';

const Help = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('faq');
  const { preferences, updatePreferences } = useAppStore();
  const { startOnboarding } = useOnboarding();

  const quickStartGuides = [
    {
      title: 'Manufacturer Quick Start',
      description: 'Learn how to register products and manage your supply chain',
      duration: '5 min read',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-blue-100 text-blue-600',
    },
    {
      title: 'Distributor Guide',
      description: 'Accept shipments and transfer custody efficiently',
      duration: '4 min read',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-green-100 text-green-600',
    },
    {
      title: 'Pharmacy Setup',
      description: 'Set up your pharmacy and start verifying products',
      duration: '3 min read',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-orange-100 text-orange-600',
    },
    {
      title: 'Patient Verification',
      description: 'How to verify medicine authenticity using QR codes',
      duration: '2 min read',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-100 text-purple-600',
    },
  ];

  const helpSettings = [
    {
      title: 'Show Tooltips',
      description: 'Display helpful tooltips throughout the interface',
      enabled: preferences.help.tooltipsEnabled,
      onChange: (enabled: boolean) => updatePreferences({
        help: { ...preferences.help, tooltipsEnabled: enabled }
      }),
    },
    {
      title: 'Show Hints',
      description: 'Display contextual hints and tips',
      enabled: preferences.help.showHints,
      onChange: (enabled: boolean) => updatePreferences({
        help: { ...preferences.help, showHints: enabled }
      }),
    },
    {
      title: 'Tutorial Mode',
      description: 'Enable guided tutorials for new features',
      enabled: preferences.help.tutorialMode,
      onChange: (enabled: boolean) => updatePreferences({
        help: { ...preferences.help, tutorialMode: enabled }
      }),
    },
  ];

  const faqs = [
    {
      category: 'Getting Started',
      questions: [
        {
          q: 'How do I connect my wallet?',
          a: 'Click the "Connect Wallet" button in the top right corner, select your role (Manufacturer, Distributor, Pharmacy, or Patient), and your mock wallet will be connected. In production, this would connect to your actual Web3 wallet like MetaMask.',
        },
        {
          q: 'What blockchain is used?',
          a: 'This is a demonstration using simulated blockchain transactions. In production, Red Médica would run on Ethereum or a compatible EVM chain with support for NFT standards (ERC-721 for unique product tokens).',
        },
      ],
    },
    {
      category: 'Product Registration',
      questions: [
        {
          q: 'How do I register a new product?',
          a: 'Navigate to the Dashboard, click "Register New Product", and complete the 5-step form with product details, dates, composition, and regulatory information. The product will be registered on the blockchain with a unique ID and QR code.',
        },
        {
          q: 'Can I edit a product after registration?',
          a: 'No, blockchain records are immutable. However, you can add notes and transfer custody to update the supply chain history.',
        },
      ],
    },
    {
      category: 'Supply Chain',
      questions: [
        {
          q: 'How do I transfer custody?',
          a: 'Go to the product details page and click "Transfer Custody". Enter the recipient\'s wallet address, shipping details, and storage conditions. Confirm the transfer to record it on the blockchain.',
        },
        {
          q: 'What happens if temperature deviates during transit?',
          a: 'Temperature sensors connected via IoT integrations will automatically log deviations on the blockchain. You\'ll receive real-time alerts, and the product\'s compliance score will be updated.',
        },
      ],
    },
    {
      category: 'Verification',
      questions: [
        {
          q: 'How does QR verification work?',
          a: 'Each product has a unique QR code linked to its blockchain record. Scanning it instantly shows the complete supply chain history, manufacturing details, and authenticity verification.',
        },
        {
          q: 'What if a product cannot be verified?',
          a: 'If a product ID is not found in the blockchain, it may be counterfeit. The system will display a warning and provide options to report the suspicious product to authorities.',
        },
      ],
    },
  ];

  return (
    <>
      <div className="min-h-screen bg-white">
        <Navbar />

        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          {/* Header */}
          <div className="mb-8 md:mb-12 text-center px-2">
            <div className="mb-4 md:mb-6 inline-flex rounded-full bg-blue-100 p-3 md:p-4">
              <BookOpen className="h-8 w-8 md:h-10 md:w-10 text-blue-600" />
            </div>
            <h1 className="text-3xl md:text-4xl lg:text-6xl font-black tracking-tighter text-gray-900">
              Help & Documentation
            </h1>
            <p className="mx-auto mt-2 max-w-2xl text-base md:text-lg text-gray-600 px-4">
              Everything you need to know about Red Médica
            </p>
            
            {/* Quick Actions */}
            <div className="flex flex-wrap justify-center gap-4 mt-8">
              <Button
                onClick={startOnboarding}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Play className="h-4 w-4" />
                Start Onboarding Tour
              </Button>
              <Button
                onClick={() => setActiveTab('videos')}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Video className="h-4 w-4" />
                Watch Tutorials
              </Button>
              <Button
                onClick={() => setActiveTab('settings')}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Settings className="h-4 w-4" />
                Help Settings
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="mb-12">
            <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
              <CardContent className="p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search documentation..."
                    className="pl-12 text-base"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-5">
              <TabsTrigger value="faq" className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4" />
                FAQ
              </TabsTrigger>
              <TabsTrigger value="guides" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Guides
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center gap-2">
                <Video className="h-4 w-4" />
                Videos
              </TabsTrigger>
              <TabsTrigger value="tooltips" className="flex items-center gap-2">
                <Lightbulb className="h-4 w-4" />
                Tooltips
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>

            {/* FAQ Tab */}
            <TabsContent value="faq" className="space-y-6 pt-6">
              <div className="grid gap-8 lg:grid-cols-3">
                {/* Main Content: FAQ */}
                <div className="lg:col-span-2">
                  <h2 className="mb-6 text-3xl font-bold text-gray-900">
                    Frequently Asked Questions
                  </h2>
                  <div className="space-y-4">
                    {faqs.map((category, categoryIndex) => (
                      <Card key={categoryIndex} className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                        <CardHeader>
                          <CardTitle className="text-xl font-bold text-gray-800">{category.category}</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <Accordion type="single" collapsible className="w-full">
                            {category.questions.map((item, itemIndex) => (
                              <AccordionItem key={itemIndex} value={`item-${categoryIndex}-${itemIndex}`}>
                                <AccordionTrigger className="text-left font-medium text-gray-700 hover:text-blue-600">
                                  {item.q}
                                </AccordionTrigger>
                                <AccordionContent className="text-gray-600">
                                  {item.a}
                                </AccordionContent>
                              </AccordionItem>
                            ))}
                          </Accordion>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {/* Sidebar: Contact */}
                <div className="space-y-8">
                  {/* Contact Support */}
                  <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Contact Support</CardTitle>
                      <CardDescription>Can't find an answer? Let us know.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div>
                        <Input placeholder="Your Name" />
                      </div>
                      <div>
                        <Input type="email" placeholder="Email Address" />
                      </div>
                      <div>
                        <Textarea placeholder="Describe your issue..." rows={4} />
                      </div>
                      <Button className="w-full">
                        <Mail className="mr-2 h-4 w-4" />
                        Send Message
                      </Button>
                    </CardContent>
                  </Card>
                  
                  {/* Other ways to get help */}
                  <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Get in Touch</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex items-center gap-4">
                        <Mail className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-700">support@redmedica.com</span>
                      </div>
                      <div className="flex items-center gap-4">
                        <MessageCircle className="h-5 w-5 text-gray-500" />
                        <span className="text-gray-700">Join our Discord</span>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>

            {/* User Guides Tab */}
            <TabsContent value="guides" className="space-y-6 pt-6">
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                {quickStartGuides.map((guide, index) => (
                  <Card key={index} className="group cursor-pointer transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                    <CardContent className="p-6">
                      <div className={`rounded-full p-3 mb-4 transition-transform group-hover:scale-110 ${guide.color}`}>
                        {guide.icon}
                      </div>
                      <h3 className="font-semibold text-gray-800 mb-2">{guide.title}</h3>
                      <p className="text-sm text-gray-600 mb-3">{guide.description}</p>
                      <Badge variant="secondary" className="text-xs">
                        {guide.duration}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Detailed Guides */}
              <div className="grid gap-6 lg:grid-cols-2">
                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle>Getting Started Guide</CardTitle>
                    <CardDescription>Complete walkthrough for new users</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">1</div>
                        <span className="text-sm text-gray-800">Set up your wallet</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">2</div>
                        <span className="text-sm text-gray-800">Choose your role</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">3</div>
                        <span className="text-sm text-gray-800">Complete your first action</span>
                      </div>
                    </div>
                    <Button className="w-full" onClick={startOnboarding}>
                      Start Interactive Guide
                    </Button>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle>Advanced Features</CardTitle>
                    <CardDescription>Explore powerful capabilities</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline">Advanced</Badge>
                        <span className="text-sm text-gray-800">Batch QR Generation</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline">Advanced</Badge>
                        <span className="text-sm text-gray-800">Analytics Dashboard</span>
                      </div>
                      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                        <Badge variant="outline">Advanced</Badge>
                        <span className="text-sm text-gray-800">API Integration</span>
                      </div>
                    </div>
                    <Button variant="outline" className="w-full">
                      View Documentation
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Video Tutorials Tab */}
            <TabsContent value="videos" className="space-y-6 pt-6">
              <VideoTutorials />
            </TabsContent>

            {/* Tooltips Demo Tab */}
            <TabsContent value="tooltips" className="space-y-6 pt-6">
              <div className="text-center mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Interactive Help Tooltips</h2>
                <p className="text-gray-600">Hover over the help icons to see contextual information</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Wallet Connection
                      <HelpTooltip
                        title="Wallet Connection"
                        content="Connect your MetaMask or Polkadot.js wallet to interact with the blockchain. Your wallet is used to sign transactions and prove your identity."
                        type="info"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Learn about connecting your digital wallet to Red Médica.</p>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      QR Code Verification
                      <HelpTooltip
                        title="QR Code Verification"
                        content="Scan the QR code on the product packaging to verify its authenticity. Each QR code is unique and linked to the blockchain record."
                        type="info"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Understand how QR codes work for product verification.</p>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Product Registration
                      <HelpTooltip
                        title="Product Registration"
                        content="Register your products on the blockchain to create an immutable record. This enables supply chain tracking and authenticity verification."
                        type="info"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Learn the process of registering products on the blockchain.</p>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Custody Transfer
                      <HelpTooltip
                        title="Custody Transfer"
                        content="Transfer product custody to the next party in the supply chain. This creates a permanent record of the product's journey."
                        type="info"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Understand how to transfer product custody in the supply chain.</p>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Blockchain Status
                      <HelpTooltip
                        title="Blockchain Status"
                        content="Shows your connection status to the Moonbase Alpha testnet. Green means connected, red means disconnected."
                        type="info"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Monitor your blockchain connection status.</p>
                  </CardContent>
                </Card>

                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      Pro Tips
                      <HelpTooltip
                        title="Pro Tip"
                        content="Always verify products before dispensing to patients. This helps ensure medication safety and builds trust in the supply chain."
                        type="tip"
                      />
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-gray-600">Get helpful tips and best practices.</p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* Help Settings Tab */}
            <TabsContent value="settings" className="space-y-6 pt-6">
              <div className="max-w-2xl mx-auto">
                <h2 className="text-3xl font-bold text-gray-900 mb-6">Help Settings</h2>
                
                <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
                  <CardHeader>
                    <CardTitle>Customize Your Help Experience</CardTitle>
                    <CardDescription>
                      Adjust how help information is displayed throughout the application
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {helpSettings.map((setting, index) => (
                      <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-800">{setting.title}</h3>
                          <p className="text-sm text-gray-600">{setting.description}</p>
                        </div>
                        <Button
                          variant={setting.enabled ? "default" : "outline"}
                          size="sm"
                          onClick={() => setting.onChange(!setting.enabled)}
                        >
                          {setting.enabled ? "Enabled" : "Disabled"}
                        </Button>
                      </div>
                    ))}
                    
                    <div className="border-t pt-6">
                      <h3 className="font-semibold text-gray-800 mb-4">Onboarding</h3>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-800">Onboarding Status</span>
                          <Badge variant={preferences.onboarding.completed ? "default" : "secondary"}>
                            {preferences.onboarding.completed ? "Completed" : "Not Started"}
                          </Badge>
                        </div>
                        <Button
                          variant="outline"
                          onClick={startOnboarding}
                          className="w-full"
                        >
                          {preferences.onboarding.completed ? "Restart Onboarding" : "Start Onboarding"}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Help;
