use std::{
    io::{Read, Write},
    sync::{Arc, Mutex},
    thread,
};

use portable_pty::{native_pty_system, Child, CommandBuilder, MasterPty, PtySize};
use tauri::{AppHandle, Emitter, State};

pub struct Terminal {
    writer: Arc<Mutex<Box<dyn Write + Send>>>,
    master: Arc<Mutex<Box<dyn MasterPty + Send>>>,
    _child: Arc<Mutex<Box<dyn Child + Send>>>,
}

#[tauri::command]
pub fn write_to_terminal(data: String, terminal: State<'_, Terminal>) -> Result<(), String> {
    let mut writer = terminal
        .writer
        .lock()
        .map_err(|_| "failed to lock terminal writer")?;

    writer
        .write_all(data.as_bytes())
        .map_err(|e| e.to_string())?;

    writer.flush().map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
pub fn resize_terminal(
    cols: u16,
    rows: u16,
    terminal: State<'_, Terminal>,
) -> Result<(), String> {
    let master = terminal
        .master
        .lock()
        .map_err(|_| "failed to lock terminal master")?;

    master
        .resize(PtySize {
            rows,
            cols,
            pixel_width: 0,
            pixel_height: 0,
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

pub fn start_terminal(app: AppHandle) -> Result<Terminal, Box<dyn std::error::Error>> {
    let pty_system = native_pty_system();

    let pair = pty_system.openpty(PtySize {
        rows: 24,
        cols: 80,
        pixel_width: 0,
        pixel_height: 0,
    })?;

    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/sh".to_string());

    let mut command = CommandBuilder::new(shell);

    command.env("TERM", "xterm-256color");

    if std::env::var("SHELL")
        .map(|value| value.contains("fish"))
        .unwrap_or(false)
    {
        command.env("fish_features", "no-query-term");
    }

    let child = pair.slave.spawn_command(command)?;

    let mut reader = pair.master.try_clone_reader()?;
    let writer = pair.master.take_writer()?;
    let master = pair.master;

    let app_handle = app.clone();

    thread::spawn(move || {
        let mut buffer = [0u8; 4096];

        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,

                Ok(n) => {
                    let data = String::from_utf8_lossy(&buffer[..n]);

                    if app_handle
                        .emit("terminal-output", data.to_string())
                        .is_err()
                    {
                        break;
                    }
                }

                Err(e) => {
                    eprintln!("PTY read error: {e}");
                    break;
                }
            }
        }
    });

    Ok(Terminal {
        writer: Arc::new(Mutex::new(writer)),
        master: Arc::new(Mutex::new(master)),
        _child: Arc::new(Mutex::new(child)),
    })
}
