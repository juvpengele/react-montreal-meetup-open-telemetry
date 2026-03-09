import Link from "next/link";
import { notFound } from "next/navigation";
import {
  cities,
  fetchCityForecast,
  findCityBySlug,
  toFahrenheit,
} from "../../../shared/weather-data";

export async function generateStaticParams() {
  return cities.map((city) => ({ city: city.slug }));
}

const formatForecastDate = (value: string) => {
  if (!value) {
    return "--";
  }
  return new Date(`${value}T00:00:00`).toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
};

export default async function CityDetails({
  params,
}: Readonly<{
  params: Promise<{ city: string }>;
}>) {
  const { city } = await params;
  const cityInfo = findCityBySlug(city);

  if (!cityInfo) {
    notFound();
  }

  const forecast = await fetchCityForecast(cityInfo);
  const firstDate = forecast.days[0]?.date;
  const lastDate = forecast.days[forecast.days.length - 1]?.date;
  const firstDay = forecast.days[0];
  const firstMax = firstDay?.maxC ?? null;
  const firstMin = firstDay?.minC ?? null;
  const rangeLabel =
    firstDate && lastDate
      ? `${formatForecastDate(firstDate)} – ${formatForecastDate(lastDate)}`
      : "Forecast window";

  // OpenTelemetry: add span for city details view and include city slug.
  return (
    <main className="page">
      <nav className="nav">
        <div className="row">
          <Link className="button" href="/">
            Back to overview
          </Link>
          <Link className="button" href="/search">
            Search cities
          </Link>
        </div>
        <span className="badge">City Details</span>
      </nav>

      <section className="hero">
        <div>
          <h1>
            {forecast.name}, {forecast.region}
          </h1>
          <p>Next days forecast from WeatherAPI.</p>
        </div>
        <div className="detail-card">
          <span>Forecast window</span>
          <strong>{rangeLabel}</strong>
          <span>{forecast.error ? "Data unavailable" : "Daily summaries"}</span>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Upcoming days</h2>
          <span className="meta">High · Low · Average</span>
        </div>
        {forecast.days.length === 0 ? (
          <p className="meta">No forecast data returned.</p>
        ) : (
          <div className="forecast">
            {forecast.days.map((day) => (
              <div className="forecast-card" key={day.date}>
                <strong>{formatForecastDate(day.date)}</strong>
                <span className="meta">{day.condition ?? "—"}</span>
                <span>
                  {day.maxC ?? "--"}° / {day.minC ?? "--"}°
                </span>
                <span className="meta">
                  Avg {day.avgC ?? "--"}°C ·{" "}
                  {day.avgC === null ? "--" : toFahrenheit(day.avgC)}°F
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="details-grid">
        <div className="detail-card">
          <span>Next high</span>
          <strong>
            {firstMax === null
              ? "--"
              : `${firstMax}°C / ${toFahrenheit(firstMax)}°F`}
          </strong>
          <span>First forecast day</span>
        </div>
        <div className="detail-card">
          <span>Next low</span>
          <strong>
            {firstMin === null
              ? "--"
              : `${firstMin}°C / ${toFahrenheit(firstMin)}°F`}
          </strong>
          <span>First forecast day</span>
        </div>
        <div className="detail-card">
          <span>Forecast days</span>
          <strong>{forecast.days.length}</strong>
          <span>From WeatherAPI</span>
        </div>
        <div className="detail-card">
          <span>Conditions</span>
          <strong>{firstDay?.condition ?? "—"}</strong>
          <span>First forecast day</span>
        </div>
      </section>
    </main>
  );
}
