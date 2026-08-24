# Kacha Theatre / 咔嚓剧场

> Status: `archived-showcase`  
> Purpose: preserve the original hackathon delivery and a distinct collaboration version in one canonical repository  
> Entrypoints: `versions/original` and `versions/collaboration`  
> Validation: `npm run verify`  
> GitHub: `https://github.com/BallCard/kacha-theatre`  
> Next: maintain the project story and security boundary; do not restart product expansion without user evidence

Kacha Theatre turns a real photo into a shareable themed card and an interactive illustrated story. This repository keeps two related but genuinely different implementations.

## Versions

| Version | Path | Role |
| --- | --- | --- |
| Original hackathon delivery | `versions/original` | The first full submission, including the fortune-card and branching comic flow |
| Collaboration snapshot | `versions/collaboration` | A separate team implementation with wanted/warm posters, story caching, and TTS experiments |

The collaboration version is retained with attribution and a source reference. It is not presented as solely authored work.

## Verification

Install dependencies inside each version before running the root verification command:

```powershell
npm --prefix versions/original/server install
npm --prefix versions/original/src/frontend install
npm --prefix versions/collaboration install
npm run verify
```

See [`docs/VERSION_HISTORY.md`](docs/VERSION_HISTORY.md) for provenance and [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md) for the final verification boundary.

## Security

Runtime credentials are not part of this repository. Use the supplied `.env.example` files and rotate any credential that has previously appeared in a public commit.
