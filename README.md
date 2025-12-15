# 🍽️ Dish It Out!

A modern cooking assistant application built with React, JavaScript, and Vite. Dish It Out! helps you cook efficiently with optimized timelines, ingredient management, and step-by-step guidance.

## Overview

Dish It Out! is your personal cooking assistant that generates interactive cooking timelines to help you prepare multiple components of a dish simultaneously. Track your cooking history, search for recipes, and get organized with mise en place checklists.

## Features

### 🏠 **Home**
Simple, clean interface with three main actions:
- Enter a new recipe (URL or text)
- Search for recipes by ingredients
- View your cooking history

### 📝 **Generate Timeline**
- Input recipes via URL or plain text
- Automatic timeline generation
- Loading screen with helpful cooking tips

### 🔍 **Recipe Search**
- Search by ingredients with history tracking
- Filter by cooking time and number of dishes
- Save frequently used ingredients

### 📊 **Interactive Timeline** (Landscape View)
- Color-coded task visualization
- Parallel task scheduling
- Step-by-step markers
- Time optimization for multitasking

### ✅ **Mise en Place**
- Checklist for tools and ingredients
- Visual preparation tracking
- Direct link to cooking timeline

### 📚 **Cooking History**
- All previously cooked recipes
- Ordered by most recent
- Quick access to repeat recipes

## Design

Based on Figma prototype with:
- Clean white background
- Light green (#B3E59A) accent color
- Handwritten-style font for friendly feel
- Mobile-first with landscape timeline support

[View Figma Prototype](https://www.figma.com/design/ULJ34BDXHVxAQzLE3Up1Ov/Trenton-Eugene-O-Bannon-s-team-library?node-id=3313-3&m=dev&t=DlJIXM2TyR13CMku-1)

## Tech Stack

### Frontend
- **React 19** - Modern UI framework
- **JavaScript (JSX)** - Modern JavaScript with JSX syntax
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **CSS** - Custom styling with responsive design

### Backend
- **FastAPI** - Modern Python web framework
- **BeautifulSoup4** - Web scraping for recipe data
- **Uvicorn** - ASGI server for FastAPI
- **Python 3.11+** - Backend programming language

## Getting Started

### Prerequisites

- **Node.js** (v16 or higher) - for frontend
- **Python 3.11+** - for backend
- **npm or yarn** - package manager

### Installation

1. **Clone the repository:**
```bash
git clone https://github.com/Toba4366/CS160Project_DangDishes.git
cd CS160Project_DangDishes
```

2. **Install frontend dependencies:**
```bash
npm install
```

3. **Set up Python backend:**
```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Mac/Linux
# On Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### Running the Application

You need to run **both** the frontend and backend servers:

#### Option 1: Two Terminals (Recommended)

**Terminal 1 - Backend API:**
```bash
cd backend
source venv/bin/activate  # On Mac/Linux
python app.py
```
Backend will run on `http://localhost:8000`

**Terminal 2 - Frontend:**
```bash
npm run dev
```
Frontend will run on `http://localhost:5173`

#### Option 2: Single Command (if using npm scripts)
```bash
npm run start:all
```

Then open your browser and navigate to `http://localhost:5173`

### API Documentation

Once the backend is running, view the interactive API docs at:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Available Scripts

### Frontend
- `npm run dev` - Start frontend development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

### Backend
- `cd backend && python app.py` - Start backend API server

### Full Stack
- `npm run start:all` - Start both frontend and backend (requires concurrently package)

## Project Structure

```
CS160Project_DangDishes/
├── backend/                  # Python FastAPI backend
│   ├── app.py               # Main API server
│   ├── scraper.py           # Web scraping logic
│   ├── database.py          # History storage
│   └── requirements.txt     # Python dependencies
├── src/                     # React frontend
│   ├── pages/               # Page components
│   │   ├── Home.jsx         # Main landing with 3 buttons
│   │   ├── GenerateTimeline.jsx  # Recipe input
│   │   ├── RecipeSearch.jsx      # Ingredient search
│   │   ├── SearchResults.jsx     # Recipe results
│   │   ├── History.jsx           # Cooking history
│   │   ├── MiseEnPlace.jsx       # Prep checklist
│   │   ├── Timeline.jsx          # Interactive timeline
│   │   └── Loading.jsx           # Loading screen
│   ├── services/            # API integration
│   │   ├── api.js           # Base API client
│   │   └── recipeService.js # Recipe API calls
│   ├── assets/              # Static assets
│   ├── App.jsx              # Main app with routing
│   └── main.jsx             # Application entry point
├── package.json             # Node dependencies
└── README.md                # This file
```

## Development Team

CS160 Group Project - Dang Dishes

## License

This project is part of CS160 Project - Dang Dishes.
