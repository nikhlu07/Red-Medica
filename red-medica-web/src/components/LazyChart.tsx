import { lazy, Suspense } from "react";
import { LoadingSpinner } from "./LoadingSpinner";

// Lazy load chart components to reduce initial bundle size
const ResponsiveContainer = lazy(() => 
  import("recharts").then(module => ({ default: module.ResponsiveContainer }))
);
const LineChart = lazy(() => 
  import("recharts").then(module => ({ default: module.LineChart }))
);
const Line = lazy(() => 
  import("recharts").then(module => ({ default: module.Line }))
);
const XAxis = lazy(() => 
  import("recharts").then(module => ({ default: module.XAxis }))
);
const YAxis = lazy(() => 
  import("recharts").then(module => ({ default: module.YAxis }))
);
const CartesianGrid = lazy(() => 
  import("recharts").then(module => ({ default: module.CartesianGrid }))
);
const Tooltip = lazy(() => 
  import("recharts").then(module => ({ default: module.Tooltip }))
);

interface LazyChartProps {
  data: any[];
  dataKey: string;
  stroke?: string;
  height?: number;
}

export const LazyChart = ({ data, dataKey, stroke = "#8884d8", height = 300 }: LazyChartProps) => {
  return (
    <Suspense fallback={<div className="h-[300px] flex items-center justify-center"><LoadingSpinner /></div>}>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} />
        </LineChart>
      </ResponsiveContainer>
    </Suspense>
  );
};