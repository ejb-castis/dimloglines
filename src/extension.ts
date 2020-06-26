// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

let dimLogLines = true;
let opacity = 0.2;
let dimDecoration: vscode.TextEditorDecorationType;
let regExpsStrings : Array<string>;

function readConfig() {
	let config = vscode.workspace.getConfiguration('dimloglines');
	opacity = config.get('opacity', 0.2);
	console.log('read config, dimloglines.opactiy:', opacity);

	regExpsStrings = config.get('regExps', []);
	console.log('read config, dimloglines.regExps:', regExpsStrings);
}

function createDimDecorator() {
	if (dimDecoration) {
			dimDecoration.dispose();
	}
	dimDecoration = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions> {
			textDecoration:
			`none;
			opacity: ${opacity}`
	});
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// Use the console to output diagnostic information (console.log) and errors (console.error)
	// This line of code will only be executed once when your extension is activated
	console.log('dimloglines is now active');

	// create a decorator type that we use to decorate large numbers
	let timeout: NodeJS.Timer | undefined = undefined;
	let activeEditor = vscode.window.activeTextEditor;
	function updateDecorations() {
		if (!activeEditor) {
			return;
		}
		console.log('updateDecorations');

		readConfig();
		createDimDecorator();
		if (!dimLogLines) {
			activeEditor.setDecorations(dimDecoration, []);
			return;
		}

		let regExpArr : Array<RegExp> = [];

		for (var i in regExpsStrings) {
			regExpArr.push(RegExp(regExpsStrings[i], 'g'));
			regExpArr.push(RegExp(regExpsStrings[i], 'g'));
		}

		// regExpArr.push(/\w*LOG\s*\([\s\S]*?\)?\s*?;/g);
		// regExpArr.push(/\w*[lL]og.*?\.(Write|assert|debug|warning|info|information|report|success|error|fail|exception)\s*\(([\s\S]*?)\)?\s*?;/g);

		console.log("regex\n" + regExpArr);
		const text = activeEditor.document.getText();
		const logLines: vscode.DecorationOptions[] = [];
		let match;
		for (var i in regExpArr) {
			while ((match = regExpArr[i].exec(text))) {
				const startPos = activeEditor.document.positionAt(match.index);
				const endPos = activeEditor.document.positionAt(match.index + match[0].length);
				const decoration = { range: new vscode.Range(startPos, endPos), hoverMessage: match[0] };
				if (match[0].length > 0) {
					logLines.push(decoration);
				}
			}
		}
		activeEditor.setDecorations(dimDecoration, logLines);
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
	let disposable = vscode.commands.registerCommand('dimloglines.dim', () => {
		console.log('dim');
		dimLogLines = true;
		triggerUpdateDecorations();

		vscode.window.showInformationMessage('activate dim log lines');
	});

	context.subscriptions.push(disposable);

	let disposable2 = vscode.commands.registerCommand('dimloglines.undim', () => {
		console.log('undim');
		dimLogLines = false;
		triggerUpdateDecorations();

		vscode.window.showInformationMessage('deactivate dim log lines');
	});
	context.subscriptions.push(disposable2);
}
// this method is called when your extension is deactivated
export function deactivate() {
	console.log('dimloglines is now deactive!');
}
