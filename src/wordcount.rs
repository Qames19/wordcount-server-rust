use serde::Serialize;

#[derive(Serialize)]
pub struct WordCount {
    pub word: String,
    pub count: u32,
}
