# Restaurant Admin (React + TypeScript + Tailwind + shadcn/ui + react-pdf)

## Step 1 – Install Node.js
Install Node.js 20 or newer from https://nodejs.org

## Step 2 – Open the project and install packages
```bash
cd restaurant-admin
npm install
```

## Step 3 – Add your fonts (important)
Copy your two font files into `public/fonts/` with these exact names:
- `rabar_022.ttf`  -> body font
- `rabar_015.ttf`  -> title font

## Step 4 – Set the backend address
Copy `.env.example` to `.env` and put your ASP.NET address:
```
VITE_API_URL=https://localhost:7001
```

## Step 5 – Allow the front-end in the backend (CORS)
In your `Program.cs`:
```csharp
builder.Services.AddCors(o => o.AddDefaultPolicy(p =>
    p.WithOrigins("http://localhost:5173").AllowAnyHeader().AllowAnyMethod()));
// ...
app.UseCors();
```

## Step 6 – Run
```bash
npm run dev
```
Open http://localhost:5173 — login: `admin` / `ad1234`.

## Step 7 – Restaurant info on the invoice
Edit `src/lib/config.ts` (name, phone, address).

## Step 8 – Print on the mini printer
Sales -> "پاشەکەوتکردن و چاپکردن" (or the printer icon in Orders) -> choose 80mm or 58mm -> چاپکردن.
In the browser print window select your mini printer and set margins to "None".

## Build for production
```bash
npm run build
```

## Notes
- `src/lib/api.ts` reads the paged response (`items/totalCount/totalPages` or similar). If your C# `Pagination<T>` uses other names, change only the `normalize` function there.
- Login is front-end only, as requested. Any page without login redirects to `/login`.
