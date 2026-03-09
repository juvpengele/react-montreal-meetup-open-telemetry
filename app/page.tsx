import Link from "next/link";
import type { CSSProperties } from "react";
import {
  fetchAllCityWeather,
  formatDateLabel,
  toFahrenheit,
} from "../shared/weather-data";
import { tracer } from "../shared/tracer";

export default async function Page() {
  const span = tracer.startSpan("loaded-city");
  
  try {
    const weather = await fetchAllCityWeather();
    
    span.setAttribute("cities", JSON.stringify(weather.map((city) => city.slug)));
    span.setAttribute("page.name", "home");
    
    const firstDate = weather.find((city) => city.date)?.date;
    const dateLabel = firstDate
      ? formatDateLabel(firstDate)
      : new Date().toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        });

    span.end();

    // OpenTelemetry: add span for home page view and record API latency.
    return (
    <main className="page">
      <nav className="nav">
        <div className="row">
          <span className="badge">Weather Atlas</span>
          <span className="meta">Live snapshot · {dateLabel}</span>
        </div>
        <div className="nav-links">
          <Link className="button" href="/search">
            Search cities
          </Link>
        </div>
      </nav>

      <section className="hero">
        <div>
          <h1>Today’s temperatures from around the world.</h1>
          <p>
            This overview pulls hourly temperatures from the WeatherAPI forecast
            endpoint and summarizes each city with the daily average, high, and
            low.
          </p>
        </div>
        <div className="detail-card">
          <span>Coverage</span>
          <strong>{weather.length} cities</strong>
          <span>Forecast date: {dateLabel}</span>
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Daily summaries</h2>
          <span className="meta">Sorted by average temperature</span>
        </div>
        <div className="grid">
          {[...weather]
            .sort((a, b) => (b.averageC ?? -999) - (a.averageC ?? -999))
            .map((city, index) => (
              <article
                className="card"
                key={city.slug}
                style={{ "--delay": `${index * 70}ms` } as CSSProperties}
              >
                <div className="card-title">
                  <h3>{city.name}</h3>
                  <span className="meta">{city.region}</span>
                </div>
                {city.averageC === null ? (
                  <p className="meta">Data unavailable</p>
                ) : (
                  <>
                    <div className="row">
                      <span className="temp">
                        {city.averageC}°C / {toFahrenheit(city.averageC)}°F
                      </span>
                      <span className="chip">Avg</span>
                    </div>
                    <p className="meta">
                      High {city.highC}° · Low {city.lowC}°
                    </p>
                    <p className="meta">
                      12:00 local · {city.middayC ?? "--"}°C
                    </p>
                  </>
                )}
                <div className="row">
                  <span className="meta">{dateLabel}</span>
                  <Link className="button" href={`/details/${city.slug}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))}
        </div>
      </section>
    </main>
  );
  } catch (error) {
    span.recordException(error as Error);
    span.end();
    throw error;
  }
}
