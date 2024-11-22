import * as vscode from 'vscode';
import { DatabaseManager } from './database';
import * as path from 'path';
import { AzkarViewProvider } from './views/azkarView';
import { Azkar } from './models/azkar';

let dbManager: DatabaseManager;

export async function activate(context: vscode.ExtensionContext) {
    const dbPath = path.join(context.extensionPath, 'data', 'azkar-db');

    try {
        dbManager = new DatabaseManager(dbPath);
        var azkar: Azkar[];
        try {
            azkar = await dbManager.getAzkar();
            vscode.window.showInformationMessage('Azkar loaded successfully!');
        } catch (error) {
            vscode.window.showErrorMessage('Failed to load Azkar: ' + error);
            return;
        }
        const provider = new AzkarViewProvider(context.extensionUri, azkar);
        
        // Register view provider
        context.subscriptions.push(
            vscode.window.registerWebviewViewProvider('azkar-view', provider)
        );

        // Register your command
        let disposable = vscode.commands.registerCommand('zakker.show', async () => {
            provider.show();
        });

        context.subscriptions.push(disposable);
    } catch (error) {
        vscode.window.showErrorMessage('Failed to initialize database: ' + error);
    }
}

export function deactivate() {
    if (dbManager) {
        dbManager.close().catch(err => {
            console.error('Error closing database:', err);
        });
    }
}