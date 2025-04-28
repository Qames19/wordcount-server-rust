use axum::{
    Json, Router,
    extract::Query,
    response::IntoResponse,
    routing::{get, get_service, post},
    serve,
};
use axum_extra::extract::Multipart;
use dotenv::dotenv;
use redis::Client;
use std::collections::HashMap;
use std::env;
use std::net::SocketAddr;
use std::sync::Arc;
use tokio::net::TcpListener;
use tower_http::services::ServeDir;

mod redis_store;
mod wordcount;

use wordcount::WordCount;

#[tokio::main]
async fn main() {
    dotenv().ok();

    let redis_url = env::var("REDIS_URL").expect("REDIS_URL must be set");
    let redis_client = Arc::new(Client::open(redis_url).expect("Invalid Redis URL"));

    //Share redis_client with routes
    let app = Router::new()
        .route(
            "/api/top-words",
            get({
                let redis_client = Arc::clone(&redis_client);
                move |query: axum::extract::Query<std::collections::HashMap<String, String>>| {
                    top_words_handler(redis_client, query)
                }
            }),
        )
        .route(
            "/api/books",
            get({
                let redis_client = Arc::clone(&redis_client);
                move || list_books_handler(redis_client)
            }),
        )
        .route(
            "/api/upload",
            post({
                let redis_client = Arc::clone(&redis_client);
                move |multipart: Multipart| upload_book_handler(redis_client, multipart)
            }),
        )
        .nest_service("/assets", get_service(ServeDir::new("./frontend/assets")))
        .fallback(
            get_service(ServeDir::new("./frontend"))
                .handle_error(|_| async { (axum::http::StatusCode::NOT_FOUND, "Not Found") }),
        );

    let addr = SocketAddr::from(([127, 0, 0, 1], 3000));
    let listener = TcpListener::bind(addr).await.expect("Failed to bind");
    println!("Server running on {}", addr);

    serve(listener, app).await.unwrap();
}

async fn top_words_handler(
    redis_client: Arc<Client>,
    Query(params): Query<HashMap<String, String>>,
) -> impl IntoResponse {
    let book = params
        .get("book")
        .cloned()
        .unwrap_or_else(|| "pride-and-prejudice".to_string());

    let n = params
        .get("n")
        .and_then(|n| n.parse::<usize>().ok())
        .unwrap_or(10);

    match redis_store::get_top_words(&redis_client, &book, n).await {
        Ok(words) => {
            let response: Vec<WordCount> = words
                .into_iter()
                .map(|(word, count)| WordCount { word, count })
                .collect();
            Json(response)
        }
        Err(err) => {
            eprintln!("Redis error: {}", err);
            Json(Vec::<WordCount>::new())
        }
    }
}

async fn list_books_handler(redis_client: Arc<Client>) -> impl IntoResponse {
    match redis_store::list_books(&redis_client).await {
        Ok(books) => Json(books),
        Err(err) => {
            eprintln!("Redis error: {}", err);
            Json(Vec::<String>::new())
        }
    }
}

async fn upload_book_handler(
    redis_client: Arc<Client>,
    mut multipart: Multipart,
) -> impl IntoResponse {
    let mut book_title = None;
    let mut book_content = None;

    while let Ok(Some(field)) = multipart.next_field().await {
        let name = field.name().unwrap_or("").to_string();
        let data = field.bytes().await.unwrap_or_default();

        if name == "title" {
            book_title = Some(String::from_utf8_lossy(&data).to_string());
        } else if name == "file" {
            book_content = Some(String::from_utf8_lossy(&data).to_string());
        }
    }

    if let (Some(title), Some(content)) = (book_title, book_content) {
        let word_counts = count_words(&content);
        if let Err(err) = redis_store::save_book(&redis_client, &title, word_counts).await {
            eprintln!("Error saving book: {}", err);
            return (
                axum::http::StatusCode::INTERNAL_SERVER_ERROR,
                "Failed to save book",
            )
                .into_response();
        }
        (axum::http::StatusCode::OK, "Book uploaded successfully").into_response()
    } else {
        (axum::http::StatusCode::BAD_REQUEST, "Missing title or file").into_response()
    }
}

// TODO(cse-6332): Support .epub file uploads -> parse and index book contents

// Word counting function
fn count_words(content: &str) -> HashMap<String, u32> {
    let mut counts = HashMap::new();

    for word in content.split_whitespace() {
        let clean_word = word
            .to_lowercase()
            .chars()
            .filter(|c| c.is_alphanumeric())
            .collect::<String>();

        if !clean_word.is_empty() {
            *counts.entry(clean_word).or_insert(0) += 1;
        }
    }

    counts
}
