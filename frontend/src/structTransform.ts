import { MovieProps } from './HomePage/Album';
import { ShowingProps } from './MoviePage/ShowingsList';
import { IDedSeance } from './TimelinePage/TimelinePage';

// URL of the remote JSON
const MOVIES_URL = 'https://raw.githubusercontent.com/deodat-pere/deodat-pere.github.io/refs/heads/gh-pages/assets/movies.json';

// Holds the parsed data once loaded
let orderedMovies: Array<{ movie: MovieProps; dates: ShowingProps[] }> | null = null;

type FetchedType = {
    movies: Array<{
        movie: { 
            id: number;
            runtime: string;
            name: string;
            summary: string;
            image_link: string;
            release_date: string;
            is_new: boolean;
            is_premiere: boolean;
            is_unique: boolean;
            rating: number;
            genres: string[]; 
        },
        dates: ShowingProps[],
    }>
}

/**
 * Load movies from the remote URL and populate `orderedMovies`.
 * Call this once before using any other exported functions.
 */
export async function loadMovies(): Promise<void> {
  
  const response = await fetch(MOVIES_URL);
  const json: FetchedType = await response.json();
  orderedMovies = structuredClone(json.movies)
    .sort((a, b) => (a.movie.id - b.movie.id))
    .map(el => {
      const cinemas = Array.from(new Set(el.dates.map(d => d.cine)));
      return {
        ...el,
        movie: { ...el.movie, cinemas } as MovieProps,
      };
    });
}

/**
 * Helper to ensure data is loaded before accessing it.
 */
function ensureLoaded(): void {
  if (!orderedMovies) {
    throw new Error('Movies not loaded. Call loadMovies() first.');
  }
}

export function getMovies(): MovieProps[] {
  ensureLoaded();
  const movies: MovieProps[] = [];
  orderedMovies!.forEach(element => {
    movies.push(element.movie);
  });
  return movies;
}

export function movieById(id: number): MovieProps {
  ensureLoaded();
  return orderedMovies![id].movie;
}

export function seanceById(id: number): ShowingProps[] {
  ensureLoaded();
  return orderedMovies![id].dates;
}

export function getSeances(): IDedSeance[] {
  ensureLoaded();
  const seances: IDedSeance[] = [];
  orderedMovies!.forEach(element => {
    element.dates.forEach(seance => {
      seances.push({
        id: element.movie.id,
        seance: seance,
      });
    });
  });
  return seances;
}

export function getLocations(): string[] {
  ensureLoaded();
  const locations = new Set<string>();
  orderedMovies!.forEach(movie => {
    movie.dates.forEach(date => {
      locations.add(date.cine);
    });
  });
  return Array.from(locations);
}