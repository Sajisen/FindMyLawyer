import { useEffect, useState } from "react";
import { apiRequest } from "../../services/api.js";

const selectClass = "mt-2 w-full rounded-xl border border-brand-border bg-white px-4 py-3";
const sortNames = (a, b) => a.localeCompare(b);

export default function LocationSelect({ value, onChange, required = true }) {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [cities, setCities] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    apiRequest("/meta/locations?level=provinces")
      .then((data) => { if (active) setProvinces((data.provinces || []).sort(sortNames)); })
      .catch(() => { if (active) setError("Could not load locations. Please try again later."); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    if (!value.province) return;
    let active = true;
    apiRequest(`/meta/locations?level=districts&province=${encodeURIComponent(value.province)}`)
      .then((data) => { if (active) setDistricts(data.districts || []); })
      .catch(() => { if (active) setError("Could not load districts."); });
    return () => { active = false; };
  }, [value.province]);

  useEffect(() => {
    if (!value.province || !value.district) return;
    let active = true;
    const params = new URLSearchParams({ level: "cities", province: value.province, district: value.district });
    apiRequest(`/meta/locations?${params}`)
      .then((data) => { if (active) setCities(data.locations || []); })
      .catch(() => { if (active) setError("Could not load cities."); });
    return () => { active = false; };
  }, [value.province, value.district]);

  return (
    <>
      <label className="block text-sm font-semibold text-brand-black">Province
        <select required={required} value={value.province} onChange={(event) => {
          setDistricts([]); setCities([]); setError("");
          onChange({ province: event.target.value, district: "", officeCity: "", locationId: "" });
        }} className={selectClass}>
          <option value="">Select province</option>
          {provinces.map((province) => <option key={province} value={province}>{province}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-brand-black">District
        <select required={required} disabled={!value.province} value={value.district} onChange={(event) => {
          setCities([]); setError("");
          onChange({ ...value, district: event.target.value, officeCity: "", locationId: "" });
        }} className={selectClass}>
          <option value="">Select district</option>
          {districts.map((district) => <option key={district} value={district}>{district}</option>)}
        </select>
      </label>
      <label className="block text-sm font-semibold text-brand-black">Office city
        <select required={required} disabled={!value.district} value={value.locationId || ""} onChange={(event) => {
          const location = cities.find((item) => item.id === event.target.value);
          onChange({ ...value, officeCity: location?.city || "", locationId: location?.id || "" });
        }} className={selectClass}>
          <option value="">{!required && value.officeCity ? `Current: ${value.officeCity}` : "Select city"}</option>
          {cities.map((location) => <option key={location.id} value={location.id}>{location.city}</option>)}
        </select>
      </label>
      {error && <p role="alert" className="text-sm text-red-700 sm:col-span-2">{error}</p>}
    </>
  );
}
