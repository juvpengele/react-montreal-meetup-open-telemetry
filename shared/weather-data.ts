export type CityInfo = {
  slug: string;
  name: string;
  region: string;
  query: string;
};

export type HourlyTemperature = {
  time: string;
  temperatureC: number;
};

export type CityWeather = CityInfo & {
  date: string;
  averageC: number | null;
  highC: number | null;
  lowC: number | null;
  middayC: number | null;
  hourly: HourlyTemperature[];
  error?: string;
};

export type ForecastDay = {
  date: string;
  maxC: number | null;
  minC: number | null;
  avgC: number | null;
  condition: string | null;
};

export type CityForecast = CityInfo & {
  days: ForecastDay[];
  error?: string;
};

type WeatherApiForecastResponse = {
  forecast?: {
    forecastday?: Array<{
      date?: string;
      day?: {
        maxtemp_c?: number;
        mintemp_c?: number;
        avgtemp_c?: number;
        condition?: {
          text?: string;
        };
      };
      hour?: Array<{
        time?: string;
        temp_c?: number;
      }>;
    }>;
  };
};

const WEATHER_API_BASE = "https://api.weatherapi.com/v1";
const FORECAST_DAYS = 3;

export const cities: CityInfo[] = [
  {
    slug: "paris",
    name: "Paris",
    region: "France",
    query: "Paris",
  },
  {
    slug: "toronto",
    name: "Toronto",
    region: "Ontario, Canada",
    query: "Toronto",
  },
  {
    slug: "montreal",
    name: "Montreal",
    region: "Quebec, Canada",
    query: "Montreal",
  },
  {
    slug: "new-york",
    name: "New York",
    region: "New York, USA",
    query: "New York",
  },
  {
    slug: "melbourne",
    name: "Melbourne",
    region: "Victoria, Australia",
    query: "Melbourne",
  },
  {
    slug: "tokyo",
    name: "Tokyo",
    region: "Japan",
    query: "Tokyo",
  },
  {
    slug: "johannesburg",
    name: "Johannesburg",
    region: "South Africa",
    query: "Johannesburg",
  },
];

export const toFahrenheit = (celsius: number) =>
  Math.round((celsius * 9) / 5 + 32);

export const findCityBySlug = (slug: string) => {
  const normalized = decodeURIComponent(slug).toLowerCase();
  return cities.find((city) => city.slug === normalized);
};

export const formatDateLabel = (value: string, locale = "en-US") =>
  new Date(`${value}T00:00:00`).toLocaleDateString(locale, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

const buildForecastUrl = (city: CityInfo, apiKey: string, days: number) => {
  const params = new URLSearchParams({
    key: apiKey,
    q: city.query,
    days: days.toString(),
    aqi: "no",
    alerts: "no",
  });

  return `${WEATHER_API_BASE}/forecast.json?${params.toString()}`;
};

const computeAverage = (values: number[]) =>
  values.length === 0
    ? null
    : Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);

export const fetchCityWeather = async (city: CityInfo): Promise<CityWeather> => {
  try {
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      throw new Error("Missing WEATHERAPI_KEY");
    }

    const response = await fetch(buildForecastUrl(city, apiKey, 1), {
      next: {
        revalidate: 60 * 30,
      },
    });

    if (!response.ok) {
      throw new Error(`WeatherAPI responded with ${response.status}`);
    }

    const data = (await response.json()) as WeatherApiForecastResponse;
    const forecastDay = data.forecast?.forecastday?.[0];

    if (!forecastDay) {
      throw new Error("No forecast data returned");
    }

    const hourly: HourlyTemperature[] = (forecastDay.hour ?? [])
      .map((entry) => {
        if (!entry.time || typeof entry.temp_c !== "number") {
          return null;
        }
        return {
          time: entry.time,
          temperatureC: entry.temp_c,
        };
      })
      .filter((entry): entry is HourlyTemperature => Boolean(entry));

    const temperatures = hourly.map((entry) => entry.temperatureC);
    const midday = hourly.find((entry) => entry.time.endsWith("12:00"));
    const averageFromHourly = computeAverage(temperatures);
    const highFromHourly = temperatures.length ? Math.max(...temperatures) : null;
    const lowFromHourly = temperatures.length ? Math.min(...temperatures) : null;

    return {
      ...city,
      date: forecastDay.date ?? "",
      averageC:
        typeof forecastDay.day?.avgtemp_c === "number"
          ? Math.round(forecastDay.day.avgtemp_c)
          : averageFromHourly,
      highC:
        typeof forecastDay.day?.maxtemp_c === "number"
          ? Math.round(forecastDay.day.maxtemp_c)
          : highFromHourly,
      lowC:
        typeof forecastDay.day?.mintemp_c === "number"
          ? Math.round(forecastDay.day.mintemp_c)
          : lowFromHourly,
      middayC: midday?.temperatureC ?? null,
      hourly,
    };
  } catch (error) {
    return {
      ...city,
      date: "",
      averageC: null,
      highC: null,
      lowC: null,
      middayC: null,
      hourly: [],
      error: error instanceof Error ? error.message : "Weather unavailable",
    };
  }
};

export const fetchAllCityWeather = async () => {
  const results = await Promise.all(cities.map((city) => fetchCityWeather(city)));
  return results;
};

export const fetchCityForecast = async (
  city: CityInfo,
  days = FORECAST_DAYS
): Promise<CityForecast> => {
  try {
    const apiKey = process.env.WEATHERAPI_KEY;
    if (!apiKey) {
      throw new Error("Missing WEATHERAPI_KEY");
    }

    const response = await fetch(buildForecastUrl(city, apiKey, days), {
      next: {
        revalidate: 60 * 60,
      },
    });

    if (!response.ok) {
      throw new Error(`WeatherAPI responded with ${response.status}`);
    }

    const data = (await response.json()) as WeatherApiForecastResponse;
    const forecastDays = data.forecast?.forecastday ?? [];

    if (forecastDays.length === 0) {
      throw new Error("No forecast data returned");
    }

    const daysSummary: ForecastDay[] = forecastDays.map((day) => ({
      date: day.date ?? "",
      maxC:
        typeof day.day?.maxtemp_c === "number"
          ? Math.round(day.day.maxtemp_c)
          : null,
      minC:
        typeof day.day?.mintemp_c === "number"
          ? Math.round(day.day.mintemp_c)
          : null,
      avgC:
        typeof day.day?.avgtemp_c === "number"
          ? Math.round(day.day.avgtemp_c)
          : null,
      condition: day.day?.condition?.text ?? null,
    }));

    return {
      ...city,
      days: daysSummary,
    };
  } catch (error) {
    return {
      ...city,
      days: [],
      error: error instanceof Error ? error.message : "Forecast unavailable",
    };
  }
};
