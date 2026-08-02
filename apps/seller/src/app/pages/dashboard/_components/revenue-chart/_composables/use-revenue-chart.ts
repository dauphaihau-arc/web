import { formatMinorCurrency } from '@arc/utils';
import {
  CategoryScale,
  Chart as ChartJS,
  Filler,
  Legend,
  LinearScale,
  LineElement,
  PointElement,
  Tooltip,
  type ChartData,
  type ChartOptions,
  type TooltipItem
} from 'chart.js';
import { useChartTokens } from './use-chart-tokens';
import type { ShopDashboardResponse } from '~/domains/shop/api/dashboard/contracts/dashboard.contract';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend
);

type RevenuePoint = ShopDashboardResponse['revenue_series'][number];

export function useRevenueChart(
  points: MaybeRefOrGetter<ShopDashboardResponse['revenue_series']>,
  currency: MaybeRefOrGetter<string>
) {
  const resolvedPoints = computed(() => toValue(points));
  const resolvedCurrency = computed(() => toValue(currency));

  const { chartTokens } = useChartTokens();

  const hasRevenue = computed(() =>
    resolvedPoints.value.some(point => point.revenue_minor > 0)
  );

  const maxRevenue = computed(() =>
    Math.max(...resolvedPoints.value.map(point => point.revenue_minor), 0)
  );

  const maxRevenueLabel = computed(() =>
    formatMinorCurrency(maxRevenue.value, resolvedCurrency.value)
  );

  const chartData = computed<ChartData<'line', number[], string>>(() => ({
    labels: resolvedPoints.value.map(point => point.label),
    datasets: [
      {
        label: 'Revenue',
        data: resolvedPoints.value.map(point => point.revenue_minor),
        borderColor: chartTokens.value.primary,
        backgroundColor: chartTokens.value.primaryFill,
        pointBackgroundColor: chartTokens.value.surface,
        pointBorderColor: chartTokens.value.primary,
        pointHoverBackgroundColor: chartTokens.value.primary,
        pointHoverBorderColor: chartTokens.value.surface,
        borderWidth: 3,
        pointBorderWidth: 2,
        pointRadius: 4,
        pointHoverRadius: 5,
        fill: true,
        tension: 0.35,
      },
    ],
  }));

  const chartOptions = computed<ChartOptions<'line'>>(() => ({
    responsive: true,
    maintainAspectRatio: false,
    interaction: {
      intersect: false,
      mode: 'index',
    },
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        displayColors: false,
        backgroundColor: chartTokens.value.surface,
        borderColor: chartTokens.value.border,
        borderWidth: 1,
        titleColor: chartTokens.value.textMuted,
        bodyColor: chartTokens.value.primary,
        padding: 12,
        callbacks: {
          label: (context: TooltipItem<'line'>) =>
            formatMinorCurrency(Number(context.raw ?? 0), resolvedCurrency.value),
          afterLabel: (context: TooltipItem<'line'>) => {
            const point = resolvedPoints.value[context.dataIndex] as RevenuePoint | undefined;
            const count = point?.order_count ?? 0;
            return `${count} order${count === 1 ? '' : 's'}`;
          },
        },
      },
    },
    scales: {
      x: {
        border: {
          display: false,
        },
        grid: {
          display: false,
        },
        ticks: {
          color: chartTokens.value.textMuted,
          maxRotation: 0,
          autoSkip: true,
          maxTicksLimit: 4,
        },
      },
      y: {
        beginAtZero: true,
        border: {
          display: false,
        },
        grid: {
          color: chartTokens.value.border,
        },
        ticks: {
          color: chartTokens.value.textMuted,
          maxTicksLimit: 4,
          callback: value =>
            formatMinorCurrency(Number(value), resolvedCurrency.value),
        },
      },
    },
  }));

  return {
    chartData,
    chartOptions,
    hasRevenue,
    maxRevenueLabel,
  };
}
