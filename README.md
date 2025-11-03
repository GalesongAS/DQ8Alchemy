# 🧪 DQ8 Alchemy Pot — Recipe Finder

A small web tool I built for **Dragon Quest VIII** players who love the Alchemy Pot but don’t love flipping between wikis, PDFs, and forum posts every time they pick up a new item.

---

## 💡 Why this exists

After unlocking the Alchemy Pot, I found myself constantly:

* Opening websites or spreadsheets to search what recipes existed for new drops.
* Trying to remember which items I already had that could combine into something useful.
* Wondering if I was *close* to being able to craft an upgrade, or if I should grind more monsters.

Since I like to play in a very **grindy, completionist** way (farming drops, hoarding ingredients), I wanted a tool where I could just **tick the items in my bag** and instantly see:

* What recipes I can make right now
* What I’m *almost* able to make
* What still needs extra ingredients

So I built this as a lightweight static web app that works entirely offline.

---

## ⚙️ Features

* 🔍 **Filter and search** ingredients quickly
* ✅ **Check items you own** — updates recipes in real time
* ⚗️ **See craftable recipes first** (sorted by completion)
* 🧾 **Supports both Alchemy pots (2 and 3 ingredient recipes)**
* 🌐 **Runs anywhere** — even on mobile via GitHub Pages

---

## 🚀 How to use

1. Visit the live version:
   👉 [https://galesongas.github.io/DQ8Alchemy/)
2. Search or scroll through the ingredient list on the left.
3. Check every item you currently have.
4. The recipe list on the right updates automatically —
   craftable recipes rise to the top, followed by partials.

That’s it! No server, no sign-in, no downloads.

---

## 🧱 Technical details

* **Built with:** plain HTML, CSS, and vanilla JS
* **Data:** static JSON (`items.json` and `recipes.json`)
* **Persistence:** browser localStorage

You can clone it locally and open `index.html` directly — it’ll work offline once the JSON files are there.

---

## 🧙‍♂️ Credits
Me? 
And Square Enix for publishing this awesome timeless classic :)
