// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('Congratulations, your extension "dimloglines" is now active!');

	let dimLogLines = true;

	// create a decorator type that we use to decorate large numbers
	let timeout: NodeJS.Timer | undefined = undefined;
	const dimLogLineDecorationType = vscode.window.createTextEditorDecorationType({
		light: {
			opacity : '0.2'
		},
		dark: {
			opacity : '0.2'
		}
	});

	// const dimLogLineDecorationType = vscode.window.createTextEditorDecorationType({
	// 	//cursor: 'crosshair',
	// 	// use a themable color. See package.json for the declaration and default values.
	// 	backgroundColor: { id: 'myextension.logLineBackground' },
	// 	color: { id: 'myextension.logLineColor' }
	// });

	let activeEditor = vscode.window.activeTextEditor;

	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		const regEx = /(\w*[lLoOgGeErR]\(([\s\S]*?)\);|\w*[lLoOgGeErR]\.[\w]*\(([\s\S]*?)\);)/g;
		const text = activeEditor.document.getText();
		const logLines: vscode.DecorationOptions[] = [];
		let match;
		while ((match = regEx.exec(text))) {
			const startPos = activeEditor.document.positionAt(match.index);
			const endPos = activeEditor.document.positionAt(match.index + match[0].length);
			const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: 'log lines "' + match[0] + '"' };
			if (match[0].length > 0) {
				logLines.push(decoration);
			}
			if (dimLogLines) {
				activeEditor.setDecorations(dimLogLineDecorationType, logLines);
			} else {
				//activeEditor.setDecorations(unDimLogLineDecorationType, logLines);
			}
		}
	}

	function triggerUpdateDecorations() {
		if (timeout) {
			clearTimeout(timeout);
			timeout = undefined;
		}
		timeout = setTimeout(updateDecorations, 500);
	}

	if (activeEditor) {
		triggerUpdateDecorations();
	}

	vscode.window.onDidChangeActiveTextEditor(editor => {
		activeEditor = editor;
		if (editor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeTextDocument(event => {
		if (activeEditor && event.document === activeEditor.document) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);



	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = vscode.commands.registerCommand('extension.dimloglines', () => {
		// The code you place here will be executed every time your command is executed
		dimLogLines = true;
		updateDecorations();
		// Display a message box to the user
		vscode.window.showInformationMessage('activate DimLogLines');
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('extension.undimloglines', () => {
		// The code you place here will be executed every time your command is executed
		dimLogLines = false;
		updateDecorations();
		// Display a message box to the user
		vscode.window.showInformationMessage('activate UnDimLogLines');
	});
	context.subscriptions.push(disposable2);
}
// this method is called when your extension is deactivated
export function deactivate() { }
