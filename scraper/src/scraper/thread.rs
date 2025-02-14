use serde::{Deserialize, Serialize};
use tracing::{info, warn};

use crate::{config::Config, error::ServerError};

use super::{extract::InfoSeance, scrape_cines::parse_all};

pub fn refresh(config: &Config) -> Result<(), ServerError> {
    let infos_glob = parse_all(config).unwrap();

    let mut movies = Vec::new();
    for (id, (_, info)) in infos_glob.into_iter().enumerate() {
        movies.push(DetailedInfo {
            movie: DetailedMovie {
                id: id as u32,
                runtime: info.movie.duration,
                name: info.movie.title,
                image_link: info.movie.image,
                summary: info.movie.summary,
                release_date: info.movie.release,
                is_new: info.movie.is_new,
                is_premiere: info.movie.is_premiere,
                is_unique: (info.dates.len() == 1),
                rating: info.movie.rating,
                genres: info.movie.genres,
            },
            dates: info.dates.clone(),
        });
    }

    let stored_infos = StoredInfos { movies };
    let json = serde_json::to_string(&stored_infos).unwrap();
    let _ = std::fs::write(&config.database.file, json)
        .inspect_err(|e| warn!("Failed to write to the store: {e}"));

    info!(
        "Number of movies in the list: {}",
        stored_infos.movies.len()
    );

    Ok(())
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
struct StoredInfos {
    /// All the scraped movies
    pub movies: Vec<DetailedInfo>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub(crate) struct DetailedMovie {
    id: u32,
    runtime: String,
    name: String,
    image_link: String,
    summary: String,
    release_date: String,
    is_new: bool,
    is_premiere: bool,
    is_unique: bool,
    rating: u32,
    genres: Vec<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize, Default)]
pub(crate) struct DetailedInfo {
    pub(crate) movie: DetailedMovie,
    pub(crate) dates: Vec<InfoSeance>,
}
