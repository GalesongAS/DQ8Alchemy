DQ8 Alchemy Pot — Recipe Finder

A lightweight, static web app for Dragon Quest VIII players who love the Alchemy Pot but don’t love flipping between wikis, PDFs, and forum posts every time they pick up a new item.

Why this exists

After unlocking the Alchemy Pot, I kept:

Searching external sites to check what a new drop could combine into

Trying to remember which ingredients I already had

Wondering whether I was one item away from an upgrade or still needed to grind

I wanted a simple page where I could tick what’s in my bag and instantly see what I can make now, what I’m close to, and what still needs parts. So I built this as a small, client-only app.

Live demo

https://galesongas.github.io/DQ8Alchemy/

(Works on mobile and desktop. No sign-in. No server.)

Features

Fast ingredient search with live filtering

Category chips (e.g., Armor, Axe, etc.)

Usability filters (Hero, Yangus, Jessica, Angelo) to show results usable by selected characters

Upgraded Pot toggle to include 3-ingredient recipes

Match mode: “ANY” (OR) vs “ALL” (AND) for selected ingredients

Craftable-only mode: show only recipes you can craft right now (every ingredient is selected)

Favorites: star any result and filter to favorites only

Sorting: relevance (complete → partial → none), A→Z, or Z→A

Shareable URLs: the page URL encodes your current filters, selections, and sort; copy/paste to share your view

Local persistence: selections, filters, sort, and favorites are saved in localStorage

Static/offline friendly: just HTML/CSS/JS plus two JSON files

How to use

Open the demo (or your local index.html).

Search or browse the Ingredients list and tick items you own.

Toggle Upgraded Pot to include 3-ingredient recipes.

Choose ANY vs ALL matching, or enable Craftable only to see only fully makeable recipes.

Use category and usable-by filters to narrow results.

Click the star to favorite a result; use Favs only to list only those.

Click the Recipe Result table header to change sorting.

The share link reflects your current state; copy it to share exactly what you’re seeing.

How it works

Everything runs in the browser. Data comes from two static files in /data:

items.json — item metadata (id, name, category, optional usableBy)

recipes.json — each recipe references three fields: resultId, ingredientIds (2 or 3), and optional notes

Selections and UI state are saved to localStorage so your setup persists across visits.

Run locally

Clone the repo and open index.html in a browser. If your browser restricts fetch() on file URLs, serve the folder with any static server (for example, python -m http.server or the VS Code Live Server extension).

Contributing

Issues and PRs that improve data accuracy, add missing recipes, or refine UI/UX are welcome. Keep changes simple and static so the page remains fast and hostable on GitHub Pages.

Credits

Dragon Quest VIII and all related assets are property of their respective owners.

This is a fan-made utility for personal use. No assets from the game are bundled here.
