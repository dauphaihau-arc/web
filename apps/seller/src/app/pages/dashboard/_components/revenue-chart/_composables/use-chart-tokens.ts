type ChartTokens = {
  primary: string
  primaryFill: string
  border: string
  textMuted: string
  surface: string
};

const fallbackTokens: ChartTokens = {
  primary: '#4f46e5',
  primaryFill: 'rgba(79, 70, 229, 0.14)',
  border: '#e4e4e7',
  textMuted: '#71717a',
  surface: '#ffffff',
};

export function useChartTokens() {
  const chartTokens = ref<ChartTokens>({ ...fallbackTokens });

  if (import.meta.client) {
    onMounted(() => {
      chartTokens.value = readChartTokens();
    });
  }

  return {
    chartTokens: readonly(chartTokens),
  };
}

function readChartTokens(): ChartTokens {
  const styles = getComputedStyle(document.documentElement);
  const primary = normalizeColor(
    readCssVar(styles, '--color-primary-500', fallbackTokens.primary)
  ) ?? fallbackTokens.primary;

  return {
    primary,
    primaryFill: withOpacity(primary, 0.14) ?? fallbackTokens.primaryFill,
    border: normalizeColor(
      readCssVar(styles, '--border-subtle', fallbackTokens.border)
    ) ?? fallbackTokens.border,
    textMuted: normalizeColor(
      readCssVar(styles, '--text-muted', fallbackTokens.textMuted)
    ) ?? fallbackTokens.textMuted,
    surface: normalizeColor(
      readCssVar(styles, '--surface-default', fallbackTokens.surface)
    ) ?? fallbackTokens.surface,
  };
}

function readCssVar(styles: CSSStyleDeclaration, name: string, fallback: string) {
  return styles.getPropertyValue(name).trim() || fallback;
}

function normalizeColor(color: string) {
  const trimmed = color.trim();

  if (/^#[\dA-Fa-f]{6}$/.test(trimmed) || trimmed.startsWith('rgb')) {
    return trimmed;
  }

  const channels = trimmed
    .split(/\s+/)
    .map(value => Number(value));

  if (channels.length === 3 && channels.every(value => Number.isFinite(value))) {
    return `rgb(${channels.join(', ')})`;
  }

  return undefined;
}

function withOpacity(color: string, opacity: number) {
  if (color.startsWith('rgb(')) {
    return color.replace('rgb(', 'rgba(').replace(')', `, ${opacity})`);
  }

  const hex = color.trim().replace('#', '');

  if (/^[\dA-Fa-f]{6}$/.test(hex)) {
    const red = Number.parseInt(hex.slice(0, 2), 16);
    const green = Number.parseInt(hex.slice(2, 4), 16);
    const blue = Number.parseInt(hex.slice(4, 6), 16);

    return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
  }

  return undefined;
}
