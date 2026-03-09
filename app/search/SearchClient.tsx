"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { CityWeather } from "../../shared/weather-data";
import { toFahrenheit } from "../../shared/weather-data";

type SearchClientProps = {
  initialWeather: CityWeather[];
  dateLabel: string;
};

const suggestedTags = ["Europe", "Canada", "USA", "Australia", "Japan", "South Africa"];

export default function SearchClient({ initialWeather, dateLabel }: SearchClientProps) {
  const [query, setQuery] = useState("");

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) {
      return initialWeather;
    }

    return initialWeather.filter((city) => {
      return (
        city.name.toLowerCase().includes(normalized) ||
        city.region.toLowerCase().includes(normalized)
      );
    });
  }, [initialWeather, query]);

  // OpenTelemetry: add span for search page view and search query updates.
  return (
    <main className="page">
      <nav className="nav">
        <div className="row">
          <Link className="button" href="/">
            Back to overview
          </Link>
          <span className="badge">Search</span>
        </div>
        <span className="meta">Live snapshot · {dateLabel}</span>
      </nav>

      <section className="search-panel">
        <div className="section-title">
          <h1>Search today’s snapshots</h1>
          <span className="meta">Filter by city or region</span>
        </div>
        <label className="search-input">
          <span className="meta">Query</span>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try Toronto, Japan, or Australia..."
          />
        </label>
        <div className="search-tags">
          {suggestedTags.map((tag) => (
            <button
              className="tag"
              key={tag}
              type="button"
              onClick={() => setQuery(tag)}
            >
              {tag}
            </button>
          ))}
        </div>
      </section>

      <section>
        <div className="section-title">
          <h2>Matching cities</h2>
          <span className="meta">
            {results.length} {results.length === 1 ? "result" : "results"}
          </span>
        </div>
        <div className="grid">
          {results.length === 0 ? (
            <p className="meta">No cities match that search.</p>
          ) : (
            results.map((city) => (
              <article className="card" key={city.slug}>
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
                  </>
                )}
                <div className="row">
                  <span className="meta">{dateLabel}</span>
                  <Link className="button" href={`/details/${city.slug}`}>
                    View details
                  </Link>
                </div>
              </article>
            ))
          )}
        </div>
      </section>
    </main>
  );
}
