import { useMemo } from 'react';
import { PieChart } from '@mui/x-charts';
import { createTheme, ThemeProvider, useMediaQuery } from '@mui/material';
import { CARD_CLASS } from '../constants';
import { formatToCurrency } from '../utils';

interface CostChartProps {
  mode: "hobby" | "business";
  currency: string;
  materialCost: number;
  energyCost: number;
  maintenanceCost: number;
  depreciationCost: number;
  laborCost: number;
  preparationCost: number;
  postProcessingCost: number;
  shippingCost: number;
  packagingCost: number;
  vatAmount: number;
  margin: number;
  total: number;
}

interface ChartData {
  label: string;
  value: number;
  percentage: number;
  color: string;
}

export function CostChart({
  mode,
  currency,
  materialCost,
  energyCost,
  maintenanceCost,
  depreciationCost,
  laborCost,
  preparationCost,
  postProcessingCost,
  shippingCost,
  packagingCost,
  vatAmount,
  margin,
  total
}: CostChartProps) {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  const muiTheme = useMemo(() => createTheme({
    palette: {
      mode: prefersDarkMode ? 'dark' : 'light',
    }
  }), [prefersDarkMode]);

  const chartData = useMemo<ChartData[]>(() => {
    const data: ChartData[] = [];
    // Use solid color values that work with MUI Charts
    const colors = [
      '#3b82f6', // blue - Material
      '#10b981', // emerald - Energy  
      '#f59e0b', // amber - Maintenance
      '#6366f1', // indigo - Depreciation
      '#ef4444', // red - Labor
      '#8b5cf6', // violet - Preparation
      '#06b6d4', // cyan - Post-processing
      '#f97316', // orange - Shipping
      '#ec4899', // pink - Packaging
      '#84cc16', // lime - VAT
      '#64748b', // slate - Margin
    ];
    
    let colorIndex = 0;
    
    // Always show material and energy costs
    if (materialCost > 0) {
      data.push({
        label: 'Material',
        value: materialCost,
        percentage: (materialCost / total) * 100,
        color: colors[colorIndex++]
      });
    }
    
    if (energyCost > 0) {
      data.push({
        label: 'Energy',
        value: energyCost,
        percentage: (energyCost / total) * 100,
        color: colors[colorIndex++]
      });
    }
    
    if (maintenanceCost > 0) {
      data.push({
        label: 'Maintenance',
        value: maintenanceCost,
        percentage: (maintenanceCost / total) * 100,
        color: colors[colorIndex++]
      });
    }
    
    // Business mode specific costs
    if (mode === "business") {
      if (depreciationCost > 0) {
        data.push({
          label: 'Depreciation',
          value: depreciationCost,
          percentage: (depreciationCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (laborCost > 0) {
        data.push({
          label: 'Labor',
          value: laborCost,
          percentage: (laborCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (preparationCost > 0) {
        data.push({
          label: 'Preparation',
          value: preparationCost,
          percentage: (preparationCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (postProcessingCost > 0) {
        data.push({
          label: 'Post-processing',
          value: postProcessingCost,
          percentage: (postProcessingCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (shippingCost > 0) {
        data.push({
          label: 'Shipping',
          value: shippingCost,
          percentage: (shippingCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (packagingCost > 0) {
        data.push({
          label: 'Packaging',
          value: packagingCost,
          percentage: (packagingCost / total) * 100,
          color: colors[colorIndex++]
        });
      }
      
      if (vatAmount > 0) {
        data.push({
          label: 'VAT',
          value: vatAmount,
          percentage: (vatAmount / total) * 100,
          color: colors[colorIndex++]
        });
      }
    }
    
    if (margin > 0) {
      data.push({
        label: 'Margin',
        value: margin,
        percentage: (margin / total) * 100,
        color: colors[colorIndex++]
      });
    }
    
    return data.filter(item => item.value > 0);
  }, [mode, materialCost, energyCost, maintenanceCost, depreciationCost, laborCost, preparationCost, postProcessingCost, shippingCost, packagingCost, vatAmount, margin, total]);

  // Prepare data for MUI Charts
  const muiChartData = useMemo(() => {
    return chartData.map((item, index) => ({
      id: index,
      label: item.label,
      value: item.value,
      color: item.color,
    }));
  }, [chartData]);

  const browserLocale = (typeof navigator !== "undefined" && (navigator.languages?.[0] || navigator.language)) || "de-DE";

  // Format currency for chart tooltips
  const formatCurrency = (value: number) => {
    return formatToCurrency({
      num: value,
      currency,
      decimalPlaces: 2,
      significantDecimalPlaces: 2,
      locale: browserLocale
    });
  };

  // Custom value formatter for charts
  const valueFormatter = (item: { value: number }) => {
    const percentage = ((item.value / total) * 100).toFixed(1);
    return `${formatCurrency(item.value)} (${percentage}%)`;
  };

  if (chartData.length === 0 || total <= 0) {
    return (
      <div className={CARD_CLASS}>
        <h2 className="text-lg font-semibold mb-4">Cost Distribution</h2>
        <div className="text-center py-8 text-base-content/60">
          <p>No costs to display</p>
        </div>
      </div>
    );
  }

  return (
    <ThemeProvider theme={muiTheme}>
      <div className={CARD_CLASS}>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold">Cost Distribution</h2>
        </div>
        <div className="h-80 w-full">
            <PieChart
              series={[
                {
                    data: muiChartData,
                    highlightScope: { fade: 'global', highlight: 'item' },
                    faded: { innerRadius: 30, additionalRadius: -30, color: 'gray' },
                    valueFormatter
                }
              ]}
              slotProps={{
                legend: {
                  direction: 'horizontal',
                  position: { vertical: 'top', horizontal: 'center' }
                },
              }}
            />
        </div>
        
        {/* Summary */}
        <div className="mt-4 p-3 bg-base-200 rounded-lg">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Total Cost</span>
            <span className="text-lg font-bold text-primary">
              {formatCurrency(total)}
            </span>
          </div>
          <div className="flex justify-between items-center mt-1 text-xs text-base-content/70">
            <span>{chartData.length} categories</span>
            <span>{mode === 'business' ? 'Business' : 'Hobby'} mode</span>
          </div>
        </div>
      </div>
    </ThemeProvider>
  );
}