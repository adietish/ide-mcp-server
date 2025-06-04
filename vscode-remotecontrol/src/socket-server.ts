import * as vscode from 'vscode';
import * as net from 'net';

let server: net.Server | undefined;

const DEFAULT_PORT = 12345;

/**
 * Starts the TCP socket server.
 * @param port The port number to listen on
 */
export function startSocketServer(port: number) {
    if (server) {
        console.log(`Socket server is already running on port ${port}.`);
        return;
    }

    // Create a new TCP server
    server = net.createServer((socket) => {
        // Log when a new client connects
        console.log('Client connected to socket server.');

        socket.on('data', onReceived);

        socket.on('end', () => {
            console.log('Client disconnected from socket server.');
        });

        socket.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
        });
    });

    server.listen(port, () => {
        console.log(`Remote control listening on port ${port}.`);
        vscode.window.showInformationMessage(`Remote control listening on port ${port}.`);
    });

    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            vscode.window.showErrorMessage(`Port ${port} is already in use. Please choose a different port in settings.`);
        } else {
            vscode.window.showErrorMessage(`Remote control error: ${err.message}`);
        }
        console.error(`Remote control error: ${err.message}`);
        server = undefined;
    });
}

/**
 * Handles incoming socket data by parsing and executing commands
 * @param data The raw data received from the socket
 */
function onReceived(data: Buffer) {
    const commandString = data.toString().trim();
    console.log(`Received command: "${commandString}"`);
    vscode.window.showInformationMessage(`Received: "${commandString}"`);

    const parts = commandString.split(' ');
    const command = parts[0];
    const args = parts.slice(1);

    switch (command) {
        case 'open_editor':
            if (args.length < 1) {
                break;
            }
            let content = args.join(' ');
            vscode.workspace
                .openTextDocument({ content: content, language: 'yaml' })
                .then(document => {
                    vscode.window.showTextDocument(document);
                });
            break;
    }
}

/**
 * Stops the TCP socket server.
 */
export function stopSocketServer() {
    if (server) {
        server.close(() => {
            console.log('Socket server stopped.');
            vscode.window.showInformationMessage('Socket Command Listener stopped.');
            server = undefined;
        });
        server.unref(); // Allows the Node.js event loop to exit if this is the only active handle
    } else {
        vscode.window.showInformationMessage('Socket server is not running.');
    }
}