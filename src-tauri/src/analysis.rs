use std::collections::HashMap;
use std::fs::File;
use qca_core::simulation::file::read_from_file;
use tauri::http::Request;
use urlencoding::decode;

fn parse_query_params(query: &str) -> HashMap<String, String>{
    query.split('&').filter_map(|entry| {
        match entry.split_once('=')  {
            Some((k, v)) => Some((k.to_owned(), v.to_owned())),
            _ => None
        }
    }).collect::<HashMap<String, String>>()
}

fn f64_vec_to_u8_vec(floats: Vec<f64>) -> Vec<u8> {
    // Calculate the byte size
    let num_floats = floats.len();
    let num_bytes = num_floats * std::mem::size_of::<f64>();

    // Create a vector with the exact capacity needed
    let mut bytes = Vec::with_capacity(num_bytes);

    // Convert each f64 to its byte representation
    for &value in &floats {
        // Convert f64 to bytes in native endianness
        let value_bytes = value.to_ne_bytes();
        // Extend the bytes vector with these 8 bytes
        bytes.extend_from_slice(&value_bytes);
    }

    bytes
}

pub fn handle_load_sim(request: Request<Vec<u8>>) -> Result<Vec<u8>, String>{
    let query = request.uri().query().ok_or("Missing query parameters")?;
    let query_decoded = decode(query).map_err(|err| "Decoding failed")?;
    let query_params = parse_query_params(query_decoded.as_ref());

    let filename = query_params.get("filename")
        .ok_or("Missing query parameter 'filename'")?.as_str();
    let data_indices_str = query_params.get("indices")
        .ok_or("Missing query parameter 'indices'")?.as_str();
    let data_indices = serde_json::from_str::<Vec<usize>>(data_indices_str)
        .map_err(|err| "Invalid indices formatting")?;

    let file = File::open(filename)
        .map_err(|err| "File cannot be opened")?;

    let (design, data) = read_from_file(file)?;

    Ok(f64_vec_to_u8_vec(vec![0.0, 1.0, 2.0, 3.0]))
}