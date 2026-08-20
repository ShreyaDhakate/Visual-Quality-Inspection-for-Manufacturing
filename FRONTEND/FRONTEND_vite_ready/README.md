# Visual Quality Inspection Frontend

Vite + React frontend for the ParakhVision manufacturing inspection MVP.

## Backend

The frontend calls:

POST http://127.0.0.1:5000/api/inspect

Generated visualization files are loaded from:

http://127.0.0.1:5000/outputs/inspections/<inspection_id>/<filename>

## Run

```powershell
npm install
npm run dev
```
