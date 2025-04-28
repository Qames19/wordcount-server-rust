use redis::AsyncCommands;
use redis::Client;
use std::collections::HashMap;

pub async fn get_top_words(
    client: &Client,
    book_title: &str,
    top_n: usize,
) -> redis::RedisResult<Vec<(String, u32)>> {
    let mut con = client.get_multiplexed_async_connection().await?;
    let redis_key = format!("book:{}", book_title);

    // Fetch all words/counts from Redis hash
    let counts: Vec<(String, u32)> = con.hgetall(redis_key).await?;

    // Sort by count descending
    let mut counts_sorted = counts;
    counts_sorted.sort_by(|a, b| b.1.cmp(&a.1));

    // Return top N
    Ok(counts_sorted.into_iter().take(top_n).collect())
}

// Get list of books (keys matching "book:*")
pub async fn list_books(client: &Client) -> redis::RedisResult<Vec<String>> {
    let mut con = client.get_multiplexed_async_connection().await?;

    let keys: Vec<String> = con.keys("book:*").await?;
    let book_titles: Vec<String> = keys
        .into_iter()
        .filter_map(|k| k.strip_prefix("book:").map(String::from))
        .collect();

    Ok(book_titles)
}

// Save a new book word count into Redis
pub async fn save_book(
    client: &Client,
    book_title: &str,
    word_counts: HashMap<String, u32>,
) -> redis::RedisResult<()> {
    let mut con = client.get_multiplexed_async_connection().await?;
    let redis_key = format!("book:{}", book_title);

    let _: () = con
        .hset_multiple(redis_key, &word_counts.into_iter().collect::<Vec<_>>())
        .await?;
    Ok(())
}
