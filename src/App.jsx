import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Home from './pages/Home';
import GenerateTimeline from './pages/GenerateTimeline';
import RecipeSearch from './pages/RecipeSearch';
import SearchResults from './pages/SearchResults';
import History from './pages/History';
import EditRecipe from './pages/EditRecipe';
import MiseEnPlace from './pages/MiseEnPlace';
import Timeline from './pages/Timeline';
import Loading from './pages/Loading';
import './App.css';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="generate-timeline" element={<GenerateTimeline />} />
          <Route path="recipe-search" element={<RecipeSearch />} />
          <Route path="search-results" element={<SearchResults />} />
          <Route path="history" element={<History />} />
          <Route path="edit-recipe" element={<EditRecipe />} />
          <Route path="mise-en-place" element={<MiseEnPlace />} />
          <Route path="timeline" element={<Timeline />} />
          <Route path="loading