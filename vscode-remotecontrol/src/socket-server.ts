import * as vscode from 'vscode';
import * as net from 'net';

// Declare a variable to hold the TCP server instance
let server: net.Server | undefined;

const DEFAULT_PORT = 12345;

/**
 * Starts the TCP socket server.
 * @param port The port number to listen on
 */
export function startSocketServer(port: number) {
    // If the server is already running, log a message and return
    if (server) {
        vscode.window.showInformationMessage(`Socket server is already running on port ${port}.`);
        return;
    }

    // Create a new TCP server
    server = net.createServer((socket) => {
        // Log when a new client connects
        console.log('Client connected to socket server.');
        vscode.window.showInformationMessage('Client connected to Socket Command Listener.');

        // Handle incoming data from the client
        socket.on('data', handleSocketData);

        // Handle client disconnection
        socket.on('end', () => {
            console.log('Client disconnected from socket server.');
            vscode.window.showInformationMessage('Client disconnected from Socket Command Listener.');
        });

        // Handle socket errors
        socket.on('error', (err) => {
            console.error(`Socket error: ${err.message}`);
            vscode.window.showErrorMessage(`Socket error: ${err.message}`);
        });
    });

    // Start listening on the configured port
    server.listen(port, () => {
        console.log(`Socket server listening on port ${port}`);
        vscode.window.showInformationMessage(`Socket Command Listener started on port ${port}.`);
    });

    // Handle server errors
    server.on('error', (err: NodeJS.ErrnoException) => {
        if (err.code === 'EADDRINUSE') {
            vscode.window.showErrorMessage(`Port ${port} is already in use. Please choose a different port in settings.`);
        } else {
            vscode.window.showErrorMessage(`Server error: ${err.message}`);
        }
        console.error(`Server error: ${err.message}`);
        server = undefined; // Clear the server instance on error
    });
}

/**
 * Handles incoming socket data by parsing and executing commands
 * @param data The raw data received from the socket
 */
function handleSocketData(data: Buffer) {
    const commandString = data.toString().trim(); // Convert buffer to string and trim whitespace
    console.log(`Received command: "${commandString}"`);
    vscode.window.showInformationMessage(`Received: "${commandString}"`);

    // Parse the command and its arguments
    const parts = commandString.split(' ');
    const command = parts[0];
    const args = parts.slice(1).join(' '); // Join remaining parts as arguments

    // Execute VS Code commands based on the received message
    switch (command) {
        case 'showInfoMessage':
            vscode.window.showInformationMessage(args);
            break;
        case 'showErrorMessage':
            vscode.window.showErrorMessage(args);
            break;
        case 'openFile':
            // Open a file by path
            const filePath = vscode.Uri.file(args);
            vscode.workspace.openTextDocument(filePath).then(doc => {
                vscode.window.showTextDocument(doc);
            }).then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to open file: ${err.message}`);
            });
            break;
        case 'runCommand':
            // Execute an arbitrary VS Code command ID
            vscode.commands.executeCommand(args).then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to execute command "${args}": ${err.message}`);
            });
            break;
        case 'insertText':
            // Insert text at the current cursor position
            const editor = vscode.window.activeTextEditor;
            if (editor) {
                editor.edit(editBuilder => {
                    editBuilder.insert(editor.selection.active, args);
                }).then(undefined, err => {
                    vscode.window.showErrorMessage(`Failed to insert text: ${err.message}`);
                });
            } else {
                vscode.window.showWarningMessage('No active text editor to insert text into.');
            }
            break;
        case 'replaceSelection':
            // Replace the current selection with text
            const activeEditor = vscode.window.activeTextEditor;
            if (activeEditor) {
                activeEditor.edit(editBuilder => {
                    editBuilder.replace(activeEditor.selection, args);
                }).then(undefined, err => {
                    vscode.window.showErrorMessage(`Failed to replace selection: ${err.message}`);
                });
            } else {
                vscode.window.showWarningMessage('No active text editor to replace selection in.');
            }
            break;
        case 'saveAll':
            // Save all open files
            vscode.workspace.saveAll(true).then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to save all: ${err.message}`);
            });
            break;
        case 'closeActiveEditor':
            // Close the active text editor
            vscode.commands.executeCommand('workbench.action.closeActiveEditor').then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to close active editor: ${err.message}`);
            });
            break;
        case 'toggleTerminal':
            // Toggle the integrated terminal
            vscode.commands.executeCommand('workbench.action.terminal.toggleTerminal').then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to toggle terminal: ${err.message}`);
            });
            break;
        case 'newFile':
            // Create a new untitled file
            vscode.workspace.openTextDocument({ content: '', language: 'plaintext' }).then(doc => {
                vscode.window.showTextDocument(doc);
            }).then(undefined, err => {
                vscode.window.showErrorMessage(`Failed to create new file: ${err.message}`);
            });
            break;
        default:
            // Handle unknown commands
            vscode.window.showWarningMessage(`Unknown command received: "${command}"`);
            break;
    }
}

/**
 * Stops the TCP socket server.
 */
export function stopSocketServer() {
    // If the server is running, close it
    if (server) {
        server.close(() => {
            console.log('Socket server stopped.');
            vscode.window.showInformationMessage('Socket Command Listener stopped.');
            server = undefined; // Clear the server instance
        });
        server.unref(); // Allows the Node.js event loop to exit if this is the only active handle
    } else {
        vscode.window.showInformationMessage('Socket server is not running.');
    }
}