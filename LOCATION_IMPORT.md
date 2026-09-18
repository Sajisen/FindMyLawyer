# Sri Lanka location catalogue

The seed supplied with FindMyLawyer contains 100 distinct locations from the 100 demo lawyer profiles. They are extracted into `server/src/data/demoLocations.json`, with their existing city, district, and province spellings preserved.

The importer extends that set using the 9 provinces, 25 districts, and approximately 2,154 cities/towns in [SKIDDOW/SriLankaCitiesDatabase](https://github.com/SKIDDOW/SriLankaCitiesDatabase), licensed under [MIT](https://github.com/SKIDDOW/SriLankaCitiesDatabase/blob/main/LICENSE). This is a community-maintained city/town list, not a guarantee that every village and neighbourhood in Sri Lanka is included. Check variant spellings and any unmatched district reported by the import before applying.

From the `server` folder, with `npm install` already run:

```powershell
npm run import:locations
npm run import:locations -- --apply
```

The first command validates the source and prints its deduplicated count without connecting to MongoDB. The second connects using `server/.env` and inserts only missing location keys. Existing location records and their IDs remain unchanged. It is safe to rerun. For offline use, download `provinces.json`, `districts.json`, and `cities.json` from the linked source into one folder and run:

```powershell
npm run import:locations -- --source-dir=C:\path\to\downloaded\json
npm run import:locations -- --source-dir=C:\path\to\downloaded\json --apply
```

The application exposes province, district, and city options from the `locations` collection through `/api/meta/locations?level=provinces`, `?level=districts&province=...`, and `?level=cities&province=...&district=...`. New lawyer registrations and profile location edits submit a selected city ID. The server retrieves its canonical city, district, and province and rejects invalid or inactive IDs. Existing profiles are backfilled with a stable `locationId` when their canonical city/district/province matches the catalogue. The admin Locations panel can add, rename, archive, restore, or remove catalogue entries. Renaming a referenced location propagates the canonical text to linked lawyer profile data. Referenced locations are archived rather than hard-deleted; unused locations may be deleted. Public registration, profile editing, search suggestions, and hierarchical dropdowns expose only active database locations.

`npm run seed:meta` no longer deletes either metadata collection. Do not use the old destructive version of that script against a live database.
