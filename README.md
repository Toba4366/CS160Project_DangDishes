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
- Light green (#90ee90) accent color
- Handwritten-style font for friendly feel
- Mobile-first with landscape timeline support

[View Figma Prototype](https://www.figma.com/design/ULJ34BDXHVxAQzLE3Up1Ov/Trenton-Eugene-O-Bannon-s-team-library?node-id=3313-3&m=dev&t=DlJIXM2TyR13CMku-1)

## Tech Stack

- **React 19** - Modern UI framework
- **JavaScript (JSX)** - Modern JavaScript with JSX syntax
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **CSS** - Custom styling with responsive design

## Getting Started

### Prerequisites

- Node.js (v16 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/Toba4366/CS160Project_DangDishes.git
cd CS160Project_DangDishes
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## Project Structure

```
src/
├── pages/              # Page components
│   ├── Home.jsx        # Main landing with 3 buttons
│   ├── GenerateTimeline.jsx  # Recipe input
│   ├── RecipeSearch.jsx      # Ingredient search
│   ├── SearchResults.jsx     # Recipe results
│   ├── History.jsx           # Cooking history
│   ├── MiseEnPlace.jsx       # Prep checklist
│   ├── Timeline.jsx          # Interactive timeline
│   └── Loading.jsx           # Loading screen
├── assets/            # Static assets
├── App.jsx            # Main app with routing
└── main.jsx           # Application entry point
```

## Development Team

CS160 Group Project - Dang Dishes

## License

This project is part of CS160 Project - Dang Dishes.
