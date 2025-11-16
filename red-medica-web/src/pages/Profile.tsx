import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAppStore } from '@/lib/store';
import { Copy, Check, User, Shield, Bell, Settings as SettingsIcon, Edit } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

const Profile = () => {
  const { user, isWalletConnected } = useAppStore();
  const [copied, setCopied] = useState(false);

  if (!isWalletConnected || !user) {
    return <Navigate to="/connect" replace />;
  }

  const copyAddress = () => {
    navigator.clipboard.writeText(user.address);
    setCopied(true);
    toast.success('Address copied to clipboard');
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <style>{`
        body {
            font-family: 'Inter', sans-serif;
            background: #F7FAFC;
            color: #ffffff;
        }
        .card {
            background: #FFFFFF;
            border: 1px solid #E2E8F0;
            transition: all 0.3s ease;
            border-radius: 0.75rem;
        }
        .card:hover {
            border-color: #3B82F6;
            transform: translateY(-5px);
            box-shadow: 0 10px 25px -5px rgba(59, 130, 246, 0.1), 0 8px 10px -6px rgba(59, 130, 246, 0.1);
        }
        .cta-gradient {
            background: linear-gradient(90deg, #3B82F6, #2563EB);
            color: white;
            transition: opacity 0.3s ease;
        }
        .cta-gradient:hover {
            opacity: 0.9;
        }
        ::selection {
            background-color: #3B82F6;
            color: white;
        }
      `}</style>
      <div className="min-h-screen bg-gray-50 font-sans">
        <Navbar />

        <main className="container mx-auto max-w-7xl px-4 pt-28 pb-8">
          {/* Header */}
          <div className="mb-12 text-center">
            <div className="mb-6 inline-flex rounded-full bg-blue-100 p-4">
                <User className="h-10 w-10 text-blue-600" />
            </div>
            <h1 className="text-4xl font-black tracking-tighter text-gray-900 md:text-6xl">
              {user.name}
            </h1>
            <p className="mx-auto max-w-2xl text-lg text-gray-600">
             {user.email}
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <code className="rounded bg-gray-200 px-3 py-1 text-sm text-gray-700">
                {user.address}
              </code>
              <Button variant="ghost" size="sm" onClick={copyAddress} className="text-gray-600 hover:text-blue-600">
                {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-center gap-4">
                <div className="font-semibold text-blue-600">{user.role}</div>
                {user.verified && (
                  <div className="flex items-center gap-1 text-green-600">
                    <Shield className="h-4 w-4" />
                    <span className="text-sm font-medium">Verified</span>
                  </div>
                )}
            </div>
          </div>

          {/* Statistics */}
          <div className="mb-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Products</CardTitle>
                <User className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{user.stats.totalProducts}</div>
                <p className="text-xs text-gray-500">Managed by you</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Total Transfers</CardTitle>
                <User className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{user.stats.totalTransfers}</div>
                <p className="text-xs text-gray-500">Across all products</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Avg. Delivery</CardTitle>
                <User className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{user.stats.avgDeliveryTime} days</div>
                <p className="text-xs text-gray-500">For your shipments</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-gray-600">Trust Score</CardTitle>
                <Shield className="h-5 w-5 text-gray-400" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-gray-900">{user.stats.trustScore}/100</div>
                <p className="text-xs text-gray-500">Based on network activity</p>
              </CardContent>
            </Card>
          </div>

          {/* Settings Tabs */}
          <Card>
            <CardHeader>
                <CardTitle className="text-xl font-bold">Settings</CardTitle>
                <CardDescription className="text-gray-600">Manage your account and preferences</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs defaultValue="personal" className="space-y-6">
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="personal">
                            <User className="mr-2 h-4 w-4" />
                            Personal
                        </TabsTrigger>
                        <TabsTrigger value="notifications">
                            <Bell className="mr-2 h-4 w-4" />
                            Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security">
                            <Shield className="mr-2 h-4 w-4" />
                            Security
                        </TabsTrigger>
                        <TabsTrigger value="integrations">
                            <SettingsIcon className="mr-2 h-4 w-4" />
                            Integrations
                        </TabsTrigger>
                    </TabsList>

                    {/* Personal Information */}
                    <TabsContent value="personal">
                        <div className="space-y-4 mt-6">
                            <div>
                                <Label htmlFor="org-name" className="text-gray-700">Organization Name</Label>
                                <Input id="org-name" defaultValue={user.name} className="mt-1"/>
                            </div>
                            <div>
                                <Label htmlFor="email" className="text-gray-700">Email Address</Label>
                                <Input id="email" type="email" defaultValue={user.email} className="mt-1"/>
                            </div>
                            <div>
                                <Label htmlFor="license" className="text-gray-700">License Number</Label>
                                <Input id="license" defaultValue={user.license} className="mt-1"/>
                            </div>
                            <div>
                                <Label htmlFor="wallet" className="text-gray-700">Wallet Address (Read-only)</Label>
                                <Input id="wallet" value={user.address} readOnly className="mt-1 bg-gray-100"/>
                            </div>
                            <Button className="w-full sm:w-auto cta-gradient font-semibold">
                                <Edit className="mr-2 h-4 w-4" />
                                Save Changes
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Notifications */}
                    <TabsContent value="notifications">
                        <div className="space-y-6 mt-6">
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <div className="font-medium text-gray-900">Email Notifications</div>
                                    <div className="text-sm text-gray-600">Receive updates via email</div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <div className="font-medium text-gray-900">SMS Alerts</div>
                                    <div className="text-sm text-gray-600">Get critical alerts via SMS</div>
                                </div>
                                <Switch />
                            </div>
                            <div className="flex items-center justify-between rounded-lg border p-4">
                                <div>
                                    <div className="font-medium text-gray-900">Browser Notifications</div>
                                    <div className="text-sm text-gray-600">Real-time browser alerts</div>
                                </div>
                                <Switch defaultChecked />
                            </div>
                            <Button className="w-full sm:w-auto cta-gradient font-semibold">
                                Save Preferences
                            </Button>
                        </div>
                    </TabsContent>

                    {/* Security */}
                    <TabsContent value="security">
                        <div className="space-y-6 mt-6">
                            <div>
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div>
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <Button className="cta-gradient font-semibold">Change Password</Button>

                            <div className="border-t pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="font-medium">Two-Factor Authentication</div>
                                        <div className="text-sm text-gray-600">Add an extra layer of security</div>
                                    </div>
                                    <Switch />
                                </div>
                            </div>
                        </div>
                    </TabsContent>

                    {/* Integrations */}
                    <TabsContent value="integrations">
                        <div className="space-y-4 mt-6">
                            <div className="rounded-lg border p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">IoT Temperature Sensors</div>
                                    <div className="text-sm text-gray-600">Connect temperature monitoring devices</div>
                                </div>
                                <Button variant="outline">Configure</Button>
                            </div>
                            <div className="rounded-lg border p-4 flex items-center justify-between">
                                <div>
                                    <div className="font-medium">API Access</div>
                                    <div className="text-sm text-gray-600">Generate API keys for custom integrations</div>
                                </div>
                                <Button variant="outline">Manage Keys</Button>
                            </div>
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
          </Card>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Profile;
