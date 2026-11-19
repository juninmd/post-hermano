//! HTTP execution backend: one reqwest client, cancellable in-flight requests.

use std::{collections::HashMap, sync::Mutex, time::{Duration, Instant}};

use reqwest::{header::HeaderMap, multipart, Client, Method};
use serde::{Deserialize, Serialize};
use tauri::State;
use tokio::sync::oneshot;

#[derive(Deserialize)]
pub struct Pair {
    key: String,
    value: String,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct FormItem {
    key: String,
    value: String,
    is_file: bool,
    bytes: Option<Vec<u8>>,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct RequestData {
    request_id: Option<String>,
    url: String,
    method: String,
    headers: Vec<Pair>,
    body: Option<String>,
    body_type: String,
    form_data: Vec<FormItem>,
    url_encoded: Vec<Pair>,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Timing {
    ttfb_ms: u64,
    download_ms: u64,
}

#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ResponseData {
    timing: Timing,
    status: u16,
    status_text: String,
    headers: HashMap<String, String>,
    body: String,
}

/// Shared client (connection pooling) and cancel handles for in-flight requests.
pub struct Requests {
    client: Client,
    cancels: Mutex<HashMap<String, oneshot::Sender<()>>>,
}

impl Default for Requests {
    fn default() -> Self {
        let client = Client::builder()
            .user_agent("PingHermano/2.0")
            .connect_timeout(Duration::from_secs(30))
            .timeout(Duration::from_secs(120))
            .build()
            .expect("failed to build HTTP client");
        Self { client, cancels: Mutex::new(HashMap::new()) }
    }
}

/// Repeated headers (e.g. `Set-Cookie`) are joined with ", " instead of the last one winning,
/// and non-ASCII values are kept (lossy) instead of being blanked.
fn collect_headers(map: &HeaderMap) -> HashMap<String, String> {
    let mut out: HashMap<String, String> = HashMap::new();
    for (k, v) in map.iter() {
        let value = String::from_utf8_lossy(v.as_bytes());
        out.entry(k.as_str().to_string())
            .and_modify(|cur| {
                cur.push_str(", ");
                cur.push_str(&value);
            })
            .or_insert_with(|| value.into_owned());
    }
    out
}

async fn execute(client: &Client, r: RequestData) -> Result<ResponseData, String> {
    let method = Method::from_bytes(r.method.to_uppercase().as_bytes()).map_err(|e| e.to_string())?;
    let mut url = r.url.trim().to_string();
    if !url.contains("://") {
        url = format!("http://{url}");
    }
    let mut req = client.request(method, &url);
    for h in r.headers.iter().filter(|h| !h.key.trim().is_empty()) {
        req = req.header(h.key.trim(), &h.value);
    }
    req = match r.body_type.as_str() {
        "form-data" => {
            let mut form = multipart::Form::new();
            for i in r.form_data.into_iter().filter(|i| !i.key.is_empty()) {
                form = if i.is_file {
                    let bytes = i.bytes.ok_or_else(|| format!("File '{}' unavailable: select it again", i.value))?;
                    form.part(i.key, multipart::Part::bytes(bytes).file_name(i.value))
                } else {
                    form.text(i.key, i.value)
                };
            }
            req.multipart(form)
        }
        "x-www-form-urlencoded" => {
            let pairs: Vec<(String, String)> =
                r.url_encoded.into_iter().filter(|p| !p.key.is_empty()).map(|p| (p.key, p.value)).collect();
            req.form(&pairs)
        }
        _ => match r.body {
            Some(b) if !b.is_empty() => req.body(b),
            _ => req,
        },
    };

    let started = Instant::now();
    let res = req.send().await.map_err(|e| e.to_string())?;
    let ttfb_ms = started.elapsed().as_millis() as u64;
    let status = res.status();
    let headers = collect_headers(res.headers());
    let body = res.text().await.map_err(|e| e.to_string())?;
    let download_ms = (started.elapsed().as_millis() as u64).saturating_sub(ttfb_ms);
    Ok(ResponseData {
        timing: Timing { ttfb_ms, download_ms },
        status: status.as_u16(),
        status_text: status.canonical_reason().unwrap_or("").to_string(),
        headers,
        body,
    })
}

#[tauri::command]
pub async fn make_request(req: RequestData, state: State<'_, Requests>) -> Result<ResponseData, String> {
    let id = req.request_id.clone();
    let (tx, rx) = oneshot::channel();
    if let Some(id) = &id {
        state.cancels.lock().unwrap().insert(id.clone(), tx);
    }
    let result = tokio::select! {
        r = execute(&state.client, req) => r,
        _ = rx => Err("Request cancelled".to_string()),
    };
    if let Some(id) = &id {
        state.cancels.lock().unwrap().remove(id);
    }
    result
}

#[tauri::command]
pub fn cancel_request(request_id: String, state: State<'_, Requests>) -> bool {
    state
        .cancels
        .lock()
        .unwrap()
        .remove(&request_id)
        .map(|tx| tx.send(()).is_ok())
        .unwrap_or(false)
}

#[cfg(test)]
mod tests {
    use super::*;
    use reqwest::header::HeaderValue;

    #[test]
    fn repeated_headers_are_joined_and_non_ascii_values_kept() {
        let mut map = HeaderMap::new();
        map.append("set-cookie", HeaderValue::from_static("a=1"));
        map.append("set-cookie", HeaderValue::from_static("b=2"));
        map.append("x-name", HeaderValue::from_bytes("caf\u{e9}".as_bytes()).unwrap());
        let out = collect_headers(&map);
        assert_eq!(out["set-cookie"], "a=1, b=2");
        assert_eq!(out["x-name"], "caf\u{e9}");
    }
}
