import { useState, useMemo } from 'react';
import { Search, Filter, SortAsc, SortDesc, Calendar, Package, Building2, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';

export interface ProductFilter {
  search: string;
  category: string;
  status: string;
  dateRange: {
    from?: Date;
    to?: Date;
  };
  sortBy: 'name' | 'date' | 'batch' | 'status';
  sortOrder: 'asc' | 'desc';
}

interface ProductSearchProps {
  onFilterChange: (filters: ProductFilter) => void;
  totalResults?: number;
  className?: string;
}

const categories = [
  'All Categories',
  'Antibiotic',
  'Analgesic', 
  'Diabetes',
  'Cardiovascular',
  'Respiratory',
  'Oncology',
  'Neurology',
  'Other'
];

const statuses = [
  'All Statuses',
  'Manufactured',
  'In Transit',
  'Delivered',
  'Verified',
  'Recalled'
];

export const ProductSearch = ({ onFilterChange, totalResults, className }: ProductSearchProps) => {
  const [filters, setFilters] = useState<ProductFilter>({
    search: '',
    category: 'All Categories',
    status: 'All Statuses',
    dateRange: {},
    sortBy: 'date',
    sortOrder: 'desc'
  });

  const [showAdvanced, setShowAdvanced] = useState(false);

  const updateFilters = (newFilters: Partial<ProductFilter>) => {
    const updated = { ...filters, ...newFilters };
    setFilters(updated);
    onFilterChange(updated);
  };

  const clearFilters = () => {
    const cleared: ProductFilter = {
      search: '',
      category: 'All Categories',
      status: 'All Statuses',
      dateRange: {},
      sortBy: 'date',
      sortOrder: 'desc'
    };
    setFilters(cleared);
    onFilterChange(cleared);
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (filters.search) count++;
    if (filters.category !== 'All Categories') count++;
    if (filters.status !== 'All Statuses') count++;
    if (filters.dateRange.from || filters.dateRange.to) count++;
    return count;
  }, [filters]);

  return (
    <div className={cn("space-y-4", className)}>
      {/* Main Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search products by name, batch number, or ID..."
            value={filters.search}
            onChange={(e) => updateFilters({ search: e.target.value })}
            className="pl-10 pr-4 h-11"
          />
        </div>
        
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={cn(
              "h-11 px-4",
              showAdvanced && "bg-primary text-primary-foreground"
            )}
          >
            <Filter className="h-4 w-4 mr-2" />
            Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 text-xs">
                {activeFiltersCount}
              </Badge>
            )}
          </Button>
          
          <Select
            value={`${filters.sortBy}-${filters.sortOrder}`}
            onValueChange={(value) => {
              const [sortBy, sortOrder] = value.split('-') as [ProductFilter['sortBy'], ProductFilter['sortOrder']];
              updateFilters({ sortBy, sortOrder });
            }}
          >
            <SelectTrigger className="h-11 w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date-desc">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Newest First
                </div>
              </SelectItem>
              <SelectItem value="date-asc">
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2" />
                  Oldest First
                </div>
              </SelectItem>
              <SelectItem value="name-asc">
                <div className="flex items-center">
                  <SortAsc className="h-4 w-4 mr-2" />
                  Name A-Z
                </div>
              </SelectItem>
              <SelectItem value="name-desc">
                <div className="flex items-center">
                  <SortDesc className="h-4 w-4 mr-2" />
                  Name Z-A
                </div>
              </SelectItem>
              <SelectItem value="batch-asc">
                <div className="flex items-center">
                  <Package className="h-4 w-4 mr-2" />
                  Batch A-Z
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-4 animate-slide-up">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-gray-900">Advanced Filters</h3>
            {activeFiltersCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="h-4 w-4 mr-1" />
                Clear All
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Category Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <Select
                value={filters.category}
                onValueChange={(value) => updateFilters({ category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category} value={category}>
                      <div className="flex items-center">
                        <Building2 className="h-4 w-4 mr-2" />
                        {category}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <Select
                value={filters.status}
                onValueChange={(value) => updateFilters({ status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Date Range Filter */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manufacturing Date
              </label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !filters.dateRange.from && "text-muted-foreground"
                    )}
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    {filters.dateRange.from ? (
                      filters.dateRange.to ? (
                        <>
                          {format(filters.dateRange.from, "LLL dd, y")} -{" "}
                          {format(filters.dateRange.to, "LLL dd, y")}
                        </>
                      ) : (
                        format(filters.dateRange.from, "LLL dd, y")
                      )
                    ) : (
                      <span>Pick a date range</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <CalendarComponent
                    initialFocus
                    mode="range"
                    defaultMonth={filters.dateRange.from}
                    selected={{
                      from: filters.dateRange.from,
                      to: filters.dateRange.to
                    }}
                    onSelect={(range) => {
                      updateFilters({
                        dateRange: {
                          from: range?.from,
                          to: range?.to
                        }
                      });
                    }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>
      )}

      {/* Active Filters Display */}
      {activeFiltersCount > 0 && (
        <div className="flex flex-wrap gap-2 animate-fade-in">
          {filters.search && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Search: "{filters.search}"
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters({ search: '' })}
              />
            </Badge>
          )}
          
          {filters.category !== 'All Categories' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Category: {filters.category}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters({ category: 'All Categories' })}
              />
            </Badge>
          )}
          
          {filters.status !== 'All Statuses' && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Status: {filters.status}
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters({ status: 'All Statuses' })}
              />
            </Badge>
          )}
          
          {(filters.dateRange.from || filters.dateRange.to) && (
            <Badge variant="secondary" className="flex items-center gap-1">
              Date Range
              <X 
                className="h-3 w-3 cursor-pointer hover:text-destructive" 
                onClick={() => updateFilters({ dateRange: {} })}
              />
            </Badge>
          )}
        </div>
      )}

      {/* Results Count */}
      {totalResults !== undefined && (
        <div className="text-sm text-gray-600">
          {totalResults} product{totalResults !== 1 ? 's' : ''} found
          {activeFiltersCount > 0 && ' with current filters'}
        </div>
      )}
    </div>
  );
};