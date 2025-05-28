// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { startSocketServer, stopSocketServer } from './socket-server';

const DEFAULT_PORT = 12345;
let port: number = DEFAULT_PORT;

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
    console.log('activating "vscode-remotecontrol"');

    // Register the command to start the socket server
    let startServerDisposable = vscode.commands.registerCommand('vscode-remotecontrol.startServer', () => {
        startSocketServer(port);
    });

    // Register the command to stop the socket server
    let stopServerDisposable = vscode.commands.registerCommand('vscode-remotecontrol.stopServer', () => {
        stopSocketServer();
    });

    // Add the disposables to the context so they are cleaned up when the extension is deactivated
    context.subscriptions.push(startServerDisposable, stopServerDisposable);

    try {
        // Get the port from VS Code configuration, or use a default
        const config = vscode.workspace.getConfiguration('vscode-remotecontrol', null);
        if (config) {
            port = config.get('port', DEFAULT_PORT);
        }
        console.log(`Using port: ${port}`);
        startSocketServer(port);
    } catch (error) {
        console.error('Failed to get configuration:', error);
        // Continue with default port
        startSocketServer(DEFAULT_PORT);
    }
}

// This method is called when your extension is deactivated
export function deactivate() {
    stopSocketServer();
}
