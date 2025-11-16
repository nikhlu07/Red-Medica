import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Alert, AlertDescription, AlertTitle } from './ui/alert';
import { Progress } from './ui/progress';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Area
} from 'recharts';
import { 
  Activity, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw,
  Zap,
  Users,
  AlertCircle
} from 'lucide-react';
import { 
  usePerformanceReporting, 
  usePerformanceAlerts,
  useRealTimePerformance 
} from '../hooks/usePerformanceMonitor';
import type { PerformanceReport } from '../services/performanceMonitor';

interface PerformanceDashboardProps {
  className?: string;
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

const RoundedBar = (props: any) => {
  const { fill, x, y, width, height } = props;
  const radius = 6;
  return (
    <g>
      <rect x={x} y={y} width={width} height={height} fill={fill} rx={radius} ry={radius} />
    </g>
  );
};

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({ 
  className = '' 
}) => {
  const [selectedTimeRange, setSelectedTimeRange] = useState<'1h' | '24h' | '7d'>('24h');
  const [report, setReport] = useState<PerformanceReport | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  
  const { 
    generateReport, 
    getMetrics, 
    getTransactionMetrics, 
    getUserInteractions,
    getErrors,
    exportMetrics 
  } = usePerformanceReporting();
  
  const { alerts, resolveAlert, clearAlerts } = usePerformanceAlerts();
  const { currentReport, isMonitoring, startMonitoring, stopMonitoring } = useRealTimePerformance();

  // Generate report based on selected time range
  const refreshReport = async () => {
    setIsLoading(true);
    try {
      const now = Date.now();
      const timeRanges = {
        '1h': now - (60 * 60 * 1000),
        '24h': now - (24 * 60 * 60 * 1000),
        '7d': now - (7 * 24 * 60 * 60 * 1000)
      };

      const newReport = generateReport({
        start: timeRanges[selectedTimeRange],
        end: now
      });

      setReport(newReport);
    } catch (error) {
      console.error('Failed to generate performance report:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshReport();
  }, [selectedTimeRange]);

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(refreshReport, 30000);
    return () => clearInterval(interval);
  }, [selectedTimeRange]);

  const handleExportMetrics = () => {
    const data = exportMetrics();
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `performance-metrics-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (!report) {
    return (
      <div className={`flex items-center justify-center p-8 ${className}`}>
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading performance data...</p>
        </div>
      </div>
    );
  }

  // Prepare chart data
  const pageLoadData = getMetrics('page_load')
    .slice(-20)
    .map((metric, index) => ({
      time: new Date(metric.timestamp).toLocaleTimeString(),
      value: metric.value,
      name: metric.name
    }));

  const transactionData = getTransactionMetrics()
    .filter(tx => tx.duration !== undefined)
    .slice(-20)
    .map(tx => ({
      time: new Date(tx.startTime).toLocaleTimeString(),
      duration: tx.duration,
      operation: tx.operation,
      status: tx.status
    }));

  const errorTypeData = Object.entries(report.metrics.errors.errorsByType).map(([type, count]) => ({
    name: type,
    value: count
  }));

  const interactionData = report.metrics.userInteractions.mostUsedFeatures.slice(0, 10);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Performance Dashboard</h2>
          <p className="text-muted-foreground">
            Monitor system performance and user interactions
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleExportMetrics}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshReport}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={isMonitoring ? "destructive" : "default"}
            size="sm"
            onClick={isMonitoring ? stopMonitoring : startMonitoring}
          >
            <Activity className="h-4 w-4 mr-2" />
            {isMonitoring ? 'Stop' : 'Start'} Live
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        {(['1h', '24h', '7d'] as const).map((range) => (
          <Button
            key={range}
            variant={selectedTimeRange === range ? "default" : "outline"}
            size="sm"
            onClick={() => setSelectedTimeRange(range)}
          >
            {range}
          </Button>
        ))}
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Performance Alerts</h3>
            <Button variant="outline" size="sm" onClick={clearAlerts}>
              Clear All
            </Button>
          </div>
          {alerts.slice(0, 5).map((alert) => (
            <Alert key={alert.id} variant={alert.type === 'critical' ? 'destructive' : 'default'}>
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>
                {alert.type === 'critical' ? 'Critical' : 'Warning'}
                <Badge variant="outline" className="ml-2">
                  {new Date(alert.timestamp).toLocaleTimeString()}
                </Badge>
              </AlertTitle>
              <AlertDescription className="flex items-center justify-between">
                {alert.message}
                {!alert.resolved && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => resolveAlert(alert.id)}
                  >
                    Resolve
                  </Button>
                )}
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Page Load</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(report.metrics.pageLoad.average)}ms
            </div>
            <p className="text-xs text-muted-foreground">
              P95: {Math.round(report.metrics.pageLoad.p95)}ms
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transaction Success</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(report.metrics.blockchain.transactionSuccessRate)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {report.metrics.blockchain.totalTransactions} total
            </p>
            <Progress 
              value={report.metrics.blockchain.transactionSuccessRate} 
              className="mt-2"
            />
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">User Interactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.metrics.userInteractions.totalInteractions}
            </div>
            <p className="text-xs text-muted-foreground">
              Avg session: {Math.round(report.metrics.userInteractions.averageSessionDuration / 1000)}s
            </p>
          </CardContent>
        </Card>

        <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Error Rate</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {report.metrics.errors.totalErrors}
            </div>
            <p className="text-xs text-muted-foreground">
              {report.metrics.errors.criticalErrors} critical
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Charts */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          <TabsTrigger value="interactions">User Activity</TabsTrigger>
          <TabsTrigger value="errors">Errors</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
            <CardHeader>
              <CardTitle>Page Load Times</CardTitle>
              <CardDescription>
                Recent page load performance over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={pageLoadData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8884d8" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8884d8" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                  <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(200, 200, 200, 0.5)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="value" 
                    stroke="#8884d8" 
                    strokeWidth={2}
                    dot={false}
                  />
                  <Area type="monotone" dataKey="value" stroke={false} fillOpacity={1} fill="url(#colorValue)" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="blockchain" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
              <CardHeader>
                <CardTitle>Transaction Times</CardTitle>
                <CardDescription>
                  Recent blockchain transaction durations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={transactionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                    <defs>
                      <linearGradient id="colorDuration" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00C49F" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00C49F" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} fontSize={12} />
                    <YAxis axisLine={false} tickLine={false} fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(255, 255, 255, 0.8)',
                        backdropFilter: 'blur(5px)',
                        border: '1px solid rgba(200, 200, 200, 0.5)',
                        borderRadius: '0.5rem',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="duration" 
                      stroke="#00C49F" 
                      strokeWidth={2}
                      dot={false}
                    />
                    <Area type="monotone" dataKey="duration" stroke={false} fillOpacity={1} fill="url(#colorDuration)" />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
              <CardHeader>
                <CardTitle>Transaction Status</CardTitle>
                <CardDescription>
                  Success vs failure rates
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Success Rate</span>
                    <Badge variant="default">
                      {Math.round(report.metrics.blockchain.transactionSuccessRate)}%
                    </Badge>
                  </div>
                  <Progress value={report.metrics.blockchain.transactionSuccessRate} />
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Successful</p>
                      <p className="font-semibold">
                        {report.metrics.blockchain.totalTransactions - report.metrics.blockchain.failedTransactions}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Failed</p>
                      <p className="font-semibold">{report.metrics.blockchain.failedTransactions}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="interactions" className="space-y-4">
          <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
            <CardHeader>
              <CardTitle>Most Used Features</CardTitle>
              <CardDescription>
                Top user interactions by frequency
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={interactionData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                   <defs>
                    <linearGradient id="colorBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3B82F6" stopOpacity={0.9}/>
                      <stop offset="100%" stopColor="#2563EB" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} strokeOpacity={0.3} />
                  <XAxis dataKey="feature" axisLine={false} tickLine={false} fontSize={12} />
                  <YAxis axisLine={false} tickLine={false} fontSize={12} />
                  <Tooltip
                    cursor={{ fill: 'rgba(147, 197, 253, 0.2)' }}
                    contentStyle={{
                      backgroundColor: 'rgba(255, 255, 255, 0.8)',
                      backdropFilter: 'blur(5px)',
                      border: '1px solid rgba(200, 200, 200, 0.5)',
                      borderRadius: '0.5rem',
                      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    }}
                  />
                  <Bar dataKey="count" fill="url(#colorBar)" shape={<RoundedBar />} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="errors" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
              <CardHeader>
                <CardTitle>Error Distribution</CardTitle>
                <CardDescription>
                  Errors by type
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={errorTypeData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {errorTypeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="transition-all duration-300 ease-in-out hover:-translate-y-1 hover:shadow-xl hover:border-blue-500/50">
              <CardHeader>
                <CardTitle>Error Summary</CardTitle>
                <CardDescription>
                  Recent error statistics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {Object.entries(report.metrics.errors.errorsByType).map(([type, count]) => (
                    <div key={type} className="flex items-center justify-between">
                      <span className="capitalize">{type}</span>
                      <Badge variant={count > 5 ? "destructive" : "secondary"}>
                        {count}
                      </Badge>
                    </div>
                  ))}
                  {Object.keys(report.metrics.errors.errorsByType).length === 0 && (
                    <p className="text-muted-foreground text-center py-4">
                      No errors in selected time range
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Real-time monitoring indicator */}
      {isMonitoring && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-medium">Live monitoring active</span>
              {currentReport && (
                <Badge variant="outline">
                  Last update: {new Date(currentReport.timeRange.end).toLocaleTimeString()}
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};