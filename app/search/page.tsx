import { fetchAllCityWeather, formatDateLabel } from "../../shared/weather-data";
import SearchClient from "./SearchClient";

export default async function SearchPage() {
  const weather = await fetchAllCityWeather();
  const firstDate = weather.find((city) => city.date)?.date;
  const dateLabel = firstDate
    ? formatDateLabel(firstDate)
    : new Date().toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  return <SearchClient initialWeather={weather} dateLabel={dateLabel} />;
}
