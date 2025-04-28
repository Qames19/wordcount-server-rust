# My Wordcount Server

A simple asynchronous Rust web server that counts words from books stored in Redis.

Built using:
- [Axum](https://docs.rs/axum/)
- [Tokio](https://docs.rs/tokio/)
- [Redis](https://docs.rs/redis/)
- [Serde](https://docs.rs/serde/)

## Features

- Exposes a JSON API to retrieve the top words from a specified book.
- Asynchronous Redis connection for fast data access.
- Designed for easy extension (e.g., supporting `.epub` uploads).

## API Endpoints

### `GET /api/top-words`

Returns the top N most frequent words for a book.

#### Example:

```bash
curl http://localhost:3000/api/top-words
```

#### Response:

```json
[
  {"word": "the", "count": 42},
  {"word": "and", "count": 37},
  {"word": "pride", "count": 20},
  {"word": "prejudice", "count": 18},
  {"word": "elizabeth", "count": 15}
]
```

### `GET /api/books`

Lists all available book titles currently stored in Redis.

#### Example:
```bash
curl "http://localhost:3000/api/books"
```

#### Response:
```json
[
  "pride-and-prejudice",
  "moby-dick",
  "war-and-peace"
]
```

### `POST /api/upload`
Uploads a new book (plain text `.txt` only for now).

#### Form Fields:
 * `title` (text): Title of the book.
 * `file` (file): Plain text file containing the book content.

#### Example using `curl`:

```bash
curl -F "title=my-new-book" -F "file=@/path/to/book.txt" http://localhost:3000/api/upload
```

#### Response:

```text
Book uploaded successfully
```
or

```text
Failed to save book
```

### Running Locally

 1. Clone the repository:
```
git clone https://github.com/your-username/my-wordcount-server.git  
cd wordcount-server-rust 
```  
 2. Set up your environment:
```
cp .env.example .env
# Edit .env to match your Redis server details
```
 3. Run the server:
```
cargo run
```
 4. Access the API at:  
    a. http://localhost:3000/api/top-words  


## Future Work
 * [ ] Allow dynamic book selection via query parameters.
 * [ ] Accept `.epub` uploads to extract and process book text automatically.
 * [ ] Improve outputs (Include extra visualizations).
 * [ ] Update UI/UX to be more enjoyable/visually appealing.

## License

This project is licensed under the [MIT License](LICENSE).

