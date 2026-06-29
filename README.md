# 🚀 BigQuery Release Pulse

A real-time web application built with **Python Flask** and **Vanilla Web Technologies** (HTML5, CSS3, JavaScript) that fetches Google BigQuery release notes directly from Google Cloud's official RSS feed, with custom X (Twitter) sharing, CSV exporting, and theme customization.

![BigQuery Release Pulse Banner](https://img.shields.io/badge/Google_Cloud-BigQuery-4285F4?style=for-the-badge&logo=googlecloud&logoColor=white)
![Flask](https://img.shields.io/badge/Backend-Flask_3.0-000000?style=for-the-badge&logo=flask&logoColor=white)
![JavaScript](https://img.shields.io/badge/Frontend-Vanilla_JS-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)

---

## ✨ Features

- **Live RSS Synchronization**: Connects dynamically to `https://docs.cloud.google.com/feeds/bigquery-release-notes.xml` to parse updates in real-time.
- **🌗 Light / Dark Theme Switcher**: Toggle between dark and light modes using the header switch. Theme preferences are saved automatically in `localStorage`.
- **📊 Export to CSV**: One-click export that formats all currently filtered release notes into a structured `.csv` file for offline analysis and reporting.
- **📋 Copy to Clipboard**: Instant copy button on every card to copy formatted update details, dates, and documentation URLs.
- **Interactive Refresh & Spinner**: Manual refresh button with real-time spin animation and feed sync timestamp tracking.
- **Smart Categorization & Search**: Instant client-side search filtering across release titles, SQL details, and category badges (*Feature, GA, Preview, Changed*).
- **Custom Tweet / X Sharing Modal**: Select any release note to open a custom composer modal, tweak your message, select trending hashtags (`#BigQuery`, `#GoogleCloud`), and post instantly via Twitter Intent.

---

## 🛠️ Tech Stack

* **Backend**: Python 3, Flask, Requests, Feedparser, BeautifulSoup4
* **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Flexbox/Grid, Glassmorphism, CSS Theme Overrides), ES6 JavaScript
* **Typography & Icons**: Google Fonts (`Outfit`, `Space Grotesk`), FontAwesome 6

---

## 📂 Project Structure

```text
bigquery-release-notes-app/
├── app.py              # Flask server and XML feed parser backend
├── requirements.txt    # Python dependencies
├── .gitignore          # Git ignore patterns
├── README.md           # Project documentation
├── templates/
│   └── index.html      # Main HTML dashboard and modal layout
└── static/
    ├── css/
    │   └── style.css   # Dark & Light theme glassmorphic stylesheet
    └── js/
        └── app.js      # Theme toggle, CSV export, clipboard, & Tweet logic
```

---

## 🚀 Quick Start Guide

### 1. Prerequisites
Ensure you have **Python 3.9+** installed on your machine.

### 2. Installation
Navigate to the project directory and install the required dependencies:

```bash
cd C:\Users\v.shah\bigquery-release-notes-app
pip install -r requirements.txt
```

### 3. Run the Application
Start the Flask development server:

```bash
python app.py
```

### 4. Open in Browser
Visit `http://localhost:5000` in your web browser to view the dashboard live!

---

## 📝 License
Distributed under the MIT License. Built for tracking Google Cloud BigQuery updates.
