# Energy Consumption Calculator with React + TypeScript

![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5.7-blue)
![ESLint](https://img.shields.io/badge/ESLint-configured-purple)
![JSON](https://img.shields.io/badge/Data-equipos.json-orange)

## Overview

This project is a simple **energy consumption calculator** built with **React 19** and **TypeScript**. It should help estimate daily energy use of common household appliances. The UI includes a live search bar and a filtered list of appliances with basic information like voltage, amperage, and usage time.

## Features

✅ Searchable list of household appliances  
✅ Equipment specs loaded dynamically from a local JSON file  
✅ Clean and responsive UI using basic CSS  
✅ ESLint configured for consistent code quality  
✅ Organized TypeScript configuration for app and tooling

## Wireframes

Low-fidelity wireframes are included in the `@low_fidelity_wireframes/` folder to provide visual guidance for UI structure and layout ideas.

```
📁 @low_fidelity_wireframes/
├── 1.png
├── 2.png
└── 3.png
```

These will be used as a base for improving the UI or building a higher-fidelity design.

## Tech Stack

- **React 19** – For building the user interface
- **TypeScript** – Type-safe development
- **JSON** – Local data source for devices
- **Vite** – Development server and bundler (used internally, minimal config)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/calculo-energia-app.git
cd calculo-energia-app
```

### 2. Install Dependencies

```bash
npm install  # or yarn install
```

### 3. Run the App Locally

```bash
npm run dev  # or yarn dev
```

Visit `http://localhost:5173` in your browser.

## Scripts

- `dev` – Start local dev server
- `build` – Type check and build the project
- `lint` – Run ESLint across the project
- `preview` – Preview production build locally

## Folder Structure

```
├── data/                      # Contains equipos.json with appliance data
├── src/                       # React components, styles, and entry point
├── public/                    # Static files like logos or screenshots
├── @low_fidelity_wireframes/  # PNG wireframes for visual reference
```
