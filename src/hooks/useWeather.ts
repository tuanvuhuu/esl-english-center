import { useState, useEffect } from 'react';

interface WeatherData {
  temp: number;
  description: string;
  icon: string;
  weatherCode: number;
}

interface UseWeatherResult {
  data: WeatherData | null;
  loading: boolean;
  error: string | null;
}

const CACHE_KEY = 'esl_weather_cache';
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes

// Default: Ho Chi Minh City
const DEFAULT_LAT = 10.82;
const DEFAULT_LON = 106.63;

// WMO Weather interpretation codes → emoji + Vietnamese description
const WMO_MAP: Record<number, { emoji: string; desc: string; nightEmoji?: string }> = {
  0:  { emoji: '☀️', desc: 'Trời quang', nightEmoji: '🌙' },
  1:  { emoji: '🌤️', desc: 'Ít mây', nightEmoji: '🌙' },
  2:  { emoji: '⛅', desc: 'Mây rải rác' },
  3:  { emoji: '☁️', desc: 'Nhiều mây' },
  45: { emoji: '🌫️', desc: 'Sương mù' },
  48: { emoji: '🌫️', desc: 'Sương mù đọng' },
  51: { emoji: '🌦️', desc: 'Mưa phùn nhẹ' },
  53: { emoji: '🌦️', desc: 'Mưa phùn' },
  55: { emoji: '🌧️', desc: 'Mưa phùn dày' },
  56: { emoji: '🌧️', desc: 'Mưa phùn lạnh' },
  57: { emoji: '🌧️', desc: 'Mưa phùn lạnh dày' },
  61: { emoji: '🌧️', desc: 'Mưa nhẹ' },
  63: { emoji: '🌧️', desc: 'Mưa vừa' },
  65: { emoji: '🌧️', desc: 'Mưa to' },
  66: { emoji: '🌧️', desc: 'Mưa lạnh nhẹ' },
  67: { emoji: '🌧️', desc: 'Mưa lạnh to' },
  71: { emoji: '❄️', desc: 'Tuyết nhẹ' },
  73: { emoji: '❄️', desc: 'Tuyết vừa' },
  75: { emoji: '❄️', desc: 'Tuyết dày' },
  77: { emoji: '❄️', desc: 'Hạt tuyết' },
  80: { emoji: '🌦️', desc: 'Mưa rào nhẹ' },
  81: { emoji: '🌧️', desc: 'Mưa rào vừa' },
  82: { emoji: '🌧️', desc: 'Mưa rào to' },
  85: { emoji: '🌨️', desc: 'Tuyết rào nhẹ' },
  86: { emoji: '🌨️', desc: 'Tuyết rào dày' },
  95: { emoji: '⛈️', desc: 'Giông bão' },
  96: { emoji: '⛈️', desc: 'Giông kèm mưa đá nhẹ' },
  99: { emoji: '⛈️', desc: 'Giông kèm mưa đá lớn' },
};

const getWeatherInfo = (code: number, isNight: boolean) => {
  const info = WMO_MAP[code] || { emoji: '🌡️', desc: 'Không rõ' };
  return {
    emoji: isNight && info.nightEmoji ? info.nightEmoji : info.emoji,
    desc: info.desc,
  };
};

export const useWeather = (lat = DEFAULT_LAT, lon = DEFAULT_LON): UseWeatherResult => {
  const [data, setData] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check cache first
    try {
      const cached = localStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed = JSON.parse(cached);
        if (Date.now() - parsed.timestamp < CACHE_DURATION) {
          setData(parsed.data);
          setLoading(false);
          return;
        }
      }
    } catch { /* ignore cache errors */ }

    const fetchWeather = async () => {
      try {
        // Open-Meteo: free, no API key needed!
        const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,weather_code,is_day&timezone=auto`;
        const res = await fetch(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        const json = await res.json();
        const current = json.current;
        const code = current?.weather_code ?? 0;
        const isNight = current?.is_day === 0;
        const { emoji, desc } = getWeatherInfo(code, isNight);

        const weatherData: WeatherData = {
          temp: Math.round(current?.temperature_2m || 0),
          description: desc,
          icon: emoji,
          weatherCode: code,
        };

        setData(weatherData);

        // Cache the result
        try {
          localStorage.setItem(CACHE_KEY, JSON.stringify({
            data: weatherData,
            timestamp: Date.now(),
          }));
        } catch { /* ignore storage errors */ }
      } catch (err: any) {
        setError(err.message || 'Weather fetch failed');
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [lat, lon]);

  return { data, loading, error };
};
