use qca_core::analysis::truth_table::{generate_truth_table, TruthTable};
use qca_core::design::file::QCADesign;
use qca_core::objects::cell::QCACellIndex;
use qca_core::simulation::file::{read_from_file, QCASimulationMetadata};
use std::collections::HashMap;
use std::fs::File;
use std::str::FromStr;
use tauri::http::Request;
use urlencoding::decode;

fn parse_query_params(query: &str) -> HashMap<String, String> {
    query
        .split('&')
        .filter_map(|entry| match entry.split_once('=') {
            Some((k, v)) => Some((k.to_owned(), v.to_owned())),
            _ => None,
        })
        .collect::<HashMap<String, String>>()
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

pub fn handle_load_sim(request: Request<Vec<u8>>) -> Result<Vec<u8>, String> {
    let query = request.uri().query().ok_or("Missing query parameters")?;
    let query_decoded = decode(query).map_err(|err| "Decoding failed")?;
    let query_params = parse_query_params(query_decoded.as_ref());

    let filename = query_params
        .get("filename")
        .ok_or("Missing query parameter 'filename'")?
        .as_str();

    let data_indices_str = query_params.get("indices");
    let mut data_indices = vec![];
    if let Some(data_indices_str) = data_indices_str {
        data_indices = serde_json::from_str::<Vec<usize>>(data_indices_str)
            .map_err(|err| "Invalid indices formatting")?;
    }

    let file = File::open(filename).map_err(|err| "File cannot be opened")?;

    let (design, data) = read_from_file(file)?;

    let num_samples = data.metadata.num_samples;
    let num_floats = 4 + data
        .metadata
        .stored_cells
        .iter()
        .map(|index| {
            let layer = design.layers.get(index.layer).unwrap();
            let architecture = design
                .cell_architectures
                .get(layer.cell_architecture_id.as_str())
                .unwrap();
            architecture.dot_count as usize / 4
        })
        .sum::<usize>();

    let mut result: Vec<f64> = Vec::with_capacity(num_samples * num_floats);

    for clock in &data.clock_data {
        result.extend_from_slice(&clock);
    }

    if data_indices.len() == 0 {
        data_indices = (0..data.metadata.stored_cells.len()).collect();
    }
    for i in data_indices {
        let data_ref = data.cells_data.get(i).unwrap().data.as_ref();
        result.extend_from_slice(data_ref);
    }

    Ok(f64_vec_to_u8_vec(result))
}

#[tauri::command]
pub fn load_simulation_file(
    filename: String,
) -> Result<(QCADesign, QCASimulationMetadata), String> {
    let file = File::open(filename).map_err(|err| "File cannot be opened")?;
    let (design, data) = read_from_file(file)?;

    Ok((design, data.metadata))
}

#[tauri::command]
pub fn calculate_truth_table(
    filename: String,
    cells: Vec<QCACellIndex>,
    cell_clock_delay: HashMap<String, usize>,
    clock_threshold: f64,
    logical_threshold: f64,
) -> Result<TruthTable, String> {
    let file = File::open(filename).map_err(|err| "File cannot be opened")?;
    let (design, simulation) = read_from_file(file)?;

    let cell_clock_delay = cell_clock_delay
        .into_iter()
        .map(|(k, v)| {
            let cell_index = QCACellIndex::from_str(&k).unwrap();
            (cell_index, v)
        })
        .collect::<HashMap<QCACellIndex, usize>>();

    let truth_table = generate_truth_table(
        &design,
        &simulation,
        &cells,
        cell_clock_delay,
        clock_threshold,
        logical_threshold,
    );

    Ok(truth_table)
}
