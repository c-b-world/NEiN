import {
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Snowflake,
  Sun,
} from 'lucide-react';
import type { WeatherVisualKind } from '../../utils/weatherCodes';

interface WeatherIconProps {
  kind: WeatherVisualKind;
  className?: string;
}

export function WeatherIcon({ kind, className = 'h-5 w-5' }: WeatherIconProps) {
  switch (kind) {
    case 'clear':
      return <Sun className={`${className} text-amber-500 dark:text-amber-400`} aria-hidden="true" />;
    case 'partly':
      return <CloudSun className={`${className} text-amber-500 dark:text-amber-300`} aria-hidden="true" />;
    case 'rain':
      return <CloudRain className={`${className} text-sky-600 dark:text-sky-400`} aria-hidden="true" />;
    case 'snow':
      return <Snowflake className={`${className} text-cyan-600 dark:text-cyan-200`} aria-hidden="true" />;
    case 'thunder':
      return <CloudLightning className={`${className} text-amber-600 dark:text-amber-300`} aria-hidden="true" />;
    case 'cloudy':
    default:
      return <Cloud className={`${className} text-slate-500 dark:text-slate-300`} aria-hidden="true" />;
  }
}
