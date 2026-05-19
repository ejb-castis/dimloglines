import * as vscode from 'vscode';

const DEFAULT_OPACITY = 0.2;
const DEFAULT_MAX_FILE_SIZE_KB = 1024;
const DEFAULT_MAX_MATCHES = 5000;
const DEFAULT_DETECTION_MODE = 'builtin';
const DEFAULT_SCAN_MODE = 'visible';
const DEFAULT_VISIBLE_CONTEXT_LINES = 20;
const DEFAULT_LOGGER_NAMES = ['console', 'logger', 'log', 'LOGGER', 'clog'];
const DEFAULT_LOG_METHODS = ['trace', 'debug', 'info', 'information', 'warn', 'warning', 'error', 'fail', 'exception', 'critical', 'fatal', 'panic', 'log', 'print', 'write', 'assert', 'report', 'success'];
const DEFAULT_METHOD_SUFFIXES = ['', 'f', 'ln', 'fln', 'f1'];
const DEFAULT_LOG_FUNCTIONS = ['LOG', 'CILOG', 'DASHLOG'];

type DetectionMode = 'builtin' | 'regex' | 'both';
type ScanMode = 'visible' | 'document';

export interface TextRange {
	start: number;
	end: number;
}

export interface BuiltinDetectorConfig {
	loggerNames: string[];
	logMethods: string[];
	methodSuffixes: string[];
	logFunctions: string[];
	caseInsensitiveMethods: boolean;
}

interface DimLogLinesConfig {
	opacity: number;
	regExps: string[];
	detectionMode: DetectionMode;
	scanMode: ScanMode;
	visibleContextLines: number;
	builtinDetector: BuiltinDetectorConfig;
	maxFileSizeKb: number;
	maxMatches: number;
}

interface CompiledRegExps {
	regExps: RegExp[];
	invalidPatterns: string[];
}

let dimLogLines = true;
let dimDecoration: vscode.TextEditorDecorationType | undefined;
let currentConfig: DimLogLinesConfig;
let currentRegExps: RegExp[] = [];
let lastOpacity: number | undefined;
let warnedInvalidPatterns = '';
let warnedLargeDocument = '';

export function normalizeOpacity(value: number): number {
	if (!Number.isFinite(value)) {
		return DEFAULT_OPACITY;
	}
	return Math.max(0, Math.min(1, value));
}

export function normalizePositiveInteger(value: number, defaultValue: number): number {
	if (!Number.isFinite(value) || value <= 0) {
		return defaultValue;
	}
	return Math.floor(value);
}

export function compileRegExps(patterns: string[]): CompiledRegExps {
	const regExps: RegExp[] = [];
	const invalidPatterns: string[] = [];

	for (const pattern of patterns) {
		try {
			regExps.push(new RegExp(pattern, 'gm'));
		} catch (err) {
			invalidPatterns.push(pattern);
		}
	}

	return { regExps, invalidPatterns };
}

function normalizeStringArray(value: string[], defaultValue: string[]): string[] {
	if (!Array.isArray(value)) {
		return defaultValue;
	}

	const normalized = value
		.filter(item => typeof item === 'string')
		.map(item => item.trim())
		.filter(item => item.length > 0);

	return normalized.length > 0 ? normalized : defaultValue;
}

function normalizeMethodSuffixes(value: string[], defaultValue: string[]): string[] {
	if (!Array.isArray(value)) {
		return defaultValue;
	}

	const normalized = value
		.filter(item => typeof item === 'string')
		.map(item => item.trim());

	return normalized.length > 0 ? normalized : defaultValue;
}

export function normalizeBuiltinDetectorConfig(config: BuiltinDetectorConfig): BuiltinDetectorConfig {
	return {
		loggerNames: normalizeStringArray(config.loggerNames, DEFAULT_LOGGER_NAMES),
		logMethods: normalizeStringArray(config.logMethods, DEFAULT_LOG_METHODS),
		methodSuffixes: normalizeMethodSuffixes(config.methodSuffixes, DEFAULT_METHOD_SUFFIXES),
		logFunctions: normalizeStringArray(config.logFunctions, DEFAULT_LOG_FUNCTIONS),
		caseInsensitiveMethods: config.caseInsensitiveMethods
	};
}

export function normalizeDetectionMode(value: string): DetectionMode {
	if (value === 'regex' || value === 'both') {
		return value;
	}
	return DEFAULT_DETECTION_MODE;
}

export function normalizeScanMode(value: string): ScanMode {
	if (value === 'document') {
		return value;
	}
	return DEFAULT_SCAN_MODE;
}

function readConfig(): DimLogLinesConfig {
	const config = vscode.workspace.getConfiguration('dimloglines');
	return {
		opacity: normalizeOpacity(config.get('opacity', DEFAULT_OPACITY)),
		regExps: config.get('regExps', []),
		detectionMode: normalizeDetectionMode(config.get('detectionMode', DEFAULT_DETECTION_MODE)),
		scanMode: normalizeScanMode(config.get('scanMode', DEFAULT_SCAN_MODE)),
		visibleContextLines: normalizePositiveInteger(config.get('visibleContextLines', DEFAULT_VISIBLE_CONTEXT_LINES), DEFAULT_VISIBLE_CONTEXT_LINES),
		builtinDetector: normalizeBuiltinDetectorConfig({
			loggerNames: config.get('loggerNames', DEFAULT_LOGGER_NAMES),
			logMethods: config.get('logMethods', DEFAULT_LOG_METHODS),
			methodSuffixes: config.get('methodSuffixes', DEFAULT_METHOD_SUFFIXES),
			logFunctions: config.get('logFunctions', DEFAULT_LOG_FUNCTIONS),
			caseInsensitiveMethods: config.get('caseInsensitiveMethods', true)
		}),
		maxFileSizeKb: normalizePositiveInteger(config.get('maxFileSizeKb', DEFAULT_MAX_FILE_SIZE_KB), DEFAULT_MAX_FILE_SIZE_KB),
		maxMatches: normalizePositiveInteger(config.get('maxMatches', DEFAULT_MAX_MATCHES), DEFAULT_MAX_MATCHES)
	};
}

function refreshConfig() {
	currentConfig = readConfig();
	const compiled = compileRegExps(currentConfig.regExps);
	currentRegExps = compiled.regExps;
	reportInvalidPatterns(compiled.invalidPatterns);
	ensureDimDecorator();
}

function reportInvalidPatterns(invalidPatterns: string[]) {
	const messageKey = invalidPatterns.join('\n');
	if (!messageKey || messageKey === warnedInvalidPatterns) {
		return;
	}

	warnedInvalidPatterns = messageKey;
	vscode.window.showWarningMessage(`DimLogLines ignored invalid regular expression(s): ${invalidPatterns.join(', ')}`);
}

function ensureDimDecorator() {
	if (dimDecoration && lastOpacity === currentConfig.opacity) {
		return;
	}

	if (dimDecoration) {
		dimDecoration.dispose();
	}

	lastOpacity = currentConfig.opacity;
	dimDecoration = vscode.window.createTextEditorDecorationType(<vscode.DecorationRenderOptions>{
		opacity: `${currentConfig.opacity}`
	});
}

function clearDecorations(editor: vscode.TextEditor) {
	if (dimDecoration) {
		editor.setDecorations(dimDecoration, []);
	}
}

function getDocumentLength(document: vscode.TextDocument): number {
	if (document.lineCount === 0) {
		return 0;
	}

	const lastLine = document.lineAt(document.lineCount - 1);
	return document.offsetAt(lastLine.range.end);
}

function isDocumentTooLarge(document: vscode.TextDocument, maxFileSizeKb: number): boolean {
	return getDocumentLength(document) > maxFileSizeKb * 1024;
}

function reportLargeDocument(document: vscode.TextDocument) {
	if (warnedLargeDocument === document.uri.toString()) {
		return;
	}

	warnedLargeDocument = document.uri.toString();
	vscode.window.showWarningMessage(`DimLogLines skipped a large document over ${currentConfig.maxFileSizeKb}KB.`);
}

function isIdentifierChar(char: string): boolean {
	return /[A-Za-z0-9_$]/.test(char);
}

function isBoundaryBefore(text: string, index: number): boolean {
	return index === 0 || !isIdentifierChar(text[index - 1]);
}

function isCallTargetBoundaryBefore(text: string, index: number): boolean {
	return index === 0 || (!isIdentifierChar(text[index - 1]) && text[index - 1] !== '.');
}

function isBoundaryAfter(text: string, index: number): boolean {
	return index >= text.length || !isIdentifierChar(text[index]);
}

function skipWhitespace(text: string, index: number): number {
	while (index < text.length && /\s/.test(text[index])) {
		index++;
	}
	return index;
}

function createMethodNames(methods: string[], suffixes: string[], caseInsensitive: boolean): string[] {
	const names = new Set<string>();

	for (const method of methods) {
		for (const suffix of suffixes) {
			const name = method + suffix;
			names.add(caseInsensitive ? name.toLowerCase() : name);
		}
	}

	return Array.from(names).sort((a, b) => b.length - a.length);
}

function matchName(text: string, index: number, name: string, caseInsensitive: boolean): boolean {
	const candidate = text.slice(index, index + name.length);
	return caseInsensitive ? candidate.toLowerCase() === name.toLowerCase() : candidate === name;
}

function findCallEnd(text: string, openParenIndex: number): number | undefined {
	let depth = 0;
	let quote: string | undefined;
	let inLineComment = false;
	let inBlockComment = false;
	let escaped = false;

	for (let i = openParenIndex; i < text.length; i++) {
		const char = text[i];
		const next = text[i + 1];

		if (inLineComment) {
			if (char === '\n') {
				inLineComment = false;
			}
			continue;
		}

		if (inBlockComment) {
			if (char === '*' && next === '/') {
				inBlockComment = false;
				i++;
			}
			continue;
		}

		if (quote) {
			if (escaped) {
				escaped = false;
				continue;
			}
			if (char === '\\') {
				escaped = true;
				continue;
			}
			if (char === quote) {
				quote = undefined;
			}
			continue;
		}

		if (char === '/' && next === '/') {
			inLineComment = true;
			i++;
			continue;
		}

		if (char === '/' && next === '*') {
			inBlockComment = true;
			i++;
			continue;
		}

		if (char === '"' || char === '\'' || char === '`') {
			quote = char;
			continue;
		}

		if (char === '(') {
			depth++;
			continue;
		}

		if (char === ')') {
			depth--;
			if (depth === 0) {
				let end = i + 1;
				if (text[end] === ';') {
					end++;
				}
				return end;
			}
		}
	}

	return undefined;
}

function extendStreamExpressionEnd(text: string, callEnd: number): number {
	let index = skipWhitespace(text, callEnd);
	if (text.slice(index, index + 2) !== '<<') {
		return callEnd;
	}

	while (index < text.length && text[index] !== '\n') {
		if (text[index] === ';') {
			return index + 1;
		}
		index++;
	}

	return index;
}

function skipQuotedText(text: string, start: number): number {
	const quote = text[start];
	let escaped = false;

	for (let i = start + 1; i < text.length; i++) {
		const char = text[i];
		if (escaped) {
			escaped = false;
			continue;
		}
		if (char === '\\') {
			escaped = true;
			continue;
		}
		if (char === quote) {
			return i;
		}
	}

	return text.length - 1;
}

function skipLineComment(text: string, start: number): number {
	const end = text.indexOf('\n', start + 1);
	return end === -1 ? text.length - 1 : end;
}

function skipBlockComment(text: string, start: number): number {
	const end = text.indexOf('*/', start + 2);
	return end === -1 ? text.length - 1 : end + 1;
}

function addRange(ranges: TextRange[], start: number, end: number, maxMatches: number): boolean {
	if (end <= start) {
		return ranges.length >= maxMatches;
	}

	const previous = ranges[ranges.length - 1];
	if (previous && start < previous.end) {
		previous.end = Math.max(previous.end, end);
	} else {
		ranges.push({ start, end });
	}

	return ranges.length >= maxMatches;
}

export function mergeTextRanges(ranges: TextRange[], maxMatches: number): TextRange[] {
	const normalized = ranges
		.filter(range => range.end > range.start)
		.slice()
		.sort((a, b) => a.start - b.start || a.end - b.end);
	const merged: TextRange[] = [];

	for (const range of normalized) {
		const previous = merged[merged.length - 1];
		if (previous && range.start <= previous.end) {
			previous.end = Math.max(previous.end, range.end);
			continue;
		}

		merged.push({ start: range.start, end: range.end });
		if (merged.length >= maxMatches) {
			break;
		}
	}

	return merged;
}

export function findBuiltinLogRanges(text: string, config: BuiltinDetectorConfig, maxMatches: number): TextRange[] {
	const ranges: TextRange[] = [];
	const methodNames = createMethodNames(config.logMethods, config.methodSuffixes, config.caseInsensitiveMethods);
	const functionNames = config.logFunctions.slice().sort((a, b) => b.length - a.length);
	const loggerNames = config.loggerNames
		.map(name => config.caseInsensitiveMethods ? name.toLowerCase() : name)
		.sort((a, b) => b.length - a.length);

	for (let i = 0; i < text.length; i++) {
		if (text[i] === '"' || text[i] === '\'' || text[i] === '`') {
			i = skipQuotedText(text, i);
			continue;
		}

		if (text[i] === '/' && text[i + 1] === '/') {
			i = skipLineComment(text, i);
			continue;
		}

		if (text[i] === '#') {
			i = skipLineComment(text, i);
			continue;
		}

		if (text[i] === '/' && text[i + 1] === '*') {
			i = skipBlockComment(text, i);
			continue;
		}

		for (const functionName of functionNames) {
			if (!isCallTargetBoundaryBefore(text, i) || !matchName(text, i, functionName, false) || !isBoundaryAfter(text, i + functionName.length)) {
				continue;
			}

			const openParenIndex = skipWhitespace(text, i + functionName.length);
			if (text[openParenIndex] !== '(') {
				continue;
			}

			const end = findCallEnd(text, openParenIndex);
			if (end !== undefined && addRange(ranges, i, extendStreamExpressionEnd(text, end), maxMatches)) {
				return ranges;
			}
		}

		for (const loggerName of loggerNames) {
			if (!isCallTargetBoundaryBefore(text, i) || !matchName(text, i, loggerName, config.caseInsensitiveMethods) || !isBoundaryAfter(text, i + loggerName.length)) {
				continue;
			}

			const dotIndex = skipWhitespace(text, i + loggerName.length);
			if (text[dotIndex] !== '.') {
				continue;
			}

			const methodStart = skipWhitespace(text, dotIndex + 1);
			for (const methodName of methodNames) {
				if (!matchName(text, methodStart, methodName, config.caseInsensitiveMethods) || !isBoundaryAfter(text, methodStart + methodName.length)) {
					continue;
				}

				const openParenIndex = skipWhitespace(text, methodStart + methodName.length);
				if (text[openParenIndex] !== '(') {
					continue;
				}

				const end = findCallEnd(text, openParenIndex);
				if (end !== undefined && addRange(ranges, i, end, maxMatches)) {
					return ranges;
				}
			}
		}
	}

	return ranges;
}

export function findRegexLogRanges(text: string, regExps: RegExp[], maxMatches: number): TextRange[] {
	const ranges: TextRange[] = [];

	for (const regExp of regExps) {
		regExp.lastIndex = 0;

		let match: RegExpExecArray | null;
		while ((match = regExp.exec(text))) {
			if (addRange(ranges, match.index, match.index + match[0].length, maxMatches)) {
				return ranges;
			}

			if (match[0].length === 0) {
				regExp.lastIndex++;
			}
		}
	}

	return ranges;
}

function offsetTextRanges(ranges: TextRange[], offset: number): TextRange[] {
	return ranges.map(range => ({
		start: range.start + offset,
		end: range.end + offset
	}));
}

export function findLogRangesInText(text: string, builtinDetector: BuiltinDetectorConfig, regExps: RegExp[], detectionMode: DetectionMode, maxMatches: number): TextRange[] {
	const ranges: TextRange[] = [];

	if (detectionMode === 'builtin' || detectionMode === 'both') {
		ranges.push(...findBuiltinLogRanges(text, builtinDetector, maxMatches));
	}

	if (ranges.length < maxMatches && (detectionMode === 'regex' || detectionMode === 'both')) {
		ranges.push(...findRegexLogRanges(text, regExps, maxMatches - ranges.length));
	}

	return mergeTextRanges(ranges, maxMatches);
}

function createExpandedVisibleRanges(editor: vscode.TextEditor): vscode.Range[] {
	const document = editor.document;
	const ranges = editor.visibleRanges.length > 0
		? editor.visibleRanges
		: [new vscode.Range(0, 0, Math.min(document.lineCount - 1, 0), 0)];

	return ranges.map(range => {
		const startLine = Math.max(0, range.start.line - currentConfig.visibleContextLines);
		const endLine = Math.min(document.lineCount - 1, range.end.line + currentConfig.visibleContextLines);
		return new vscode.Range(
			startLine,
			0,
			endLine,
			document.lineAt(endLine).range.end.character
		);
	});
}

function formatVsCodeRange(range: vscode.Range): string {
	return `${range.start.line + 1}:${range.start.character + 1}-${range.end.line + 1}:${range.end.character + 1}`;
}

function findDocumentLogRanges(editor: vscode.TextEditor): TextRange[] {
	return findLogRangesInText(
		editor.document.getText(),
		currentConfig.builtinDetector,
		currentRegExps,
		currentConfig.detectionMode,
		currentConfig.maxMatches
	);
}

function findVisibleLogRanges(editor: vscode.TextEditor): TextRange[] {
	const ranges: TextRange[] = [];
	const visibleRanges = createExpandedVisibleRanges(editor);

	console.log('[dimloglines] visibleRanges', editor.visibleRanges.map(formatVsCodeRange));
	console.log('[dimloglines] expandedVisibleRanges', visibleRanges.map(formatVsCodeRange));

	for (const visibleRange of visibleRanges) {
		if (ranges.length >= currentConfig.maxMatches) {
			break;
		}

		const text = editor.document.getText(visibleRange);
		const offset = editor.document.offsetAt(visibleRange.start);
		const remainingMatches = currentConfig.maxMatches - ranges.length;
		ranges.push(...offsetTextRanges(
			findLogRangesInText(text, currentConfig.builtinDetector, currentRegExps, currentConfig.detectionMode, remainingMatches),
			offset
		));
	}

	return mergeTextRanges(ranges, currentConfig.maxMatches);
}

function findLogRanges(editor: vscode.TextEditor): TextRange[] {
	if (currentConfig.scanMode === 'document') {
		return findDocumentLogRanges(editor);
	}

	return findVisibleLogRanges(editor);
}

function createDecorationOptions(editor: vscode.TextEditor, ranges: TextRange[]): vscode.DecorationOptions[] {
	const text = editor.document.getText();
	const decorations: vscode.DecorationOptions[] = [];

	for (const range of ranges) {
		const start = editor.document.positionAt(range.start);
		const end = editor.document.positionAt(range.end);
		const hoverMessage = text.slice(range.start, range.end);

		if (start.line === end.line) {
			decorations.push({
				range: new vscode.Range(start, end),
				hoverMessage
			});
			continue;
		}

		for (let line = start.line; line <= end.line; line++) {
			const lineStart = line === start.line ? start.character : 0;
			const lineEnd = line === end.line ? end.character : editor.document.lineAt(line).range.end.character;
			if (lineEnd <= lineStart) {
				continue;
			}

			decorations.push({
				range: new vscode.Range(line, lineStart, line, lineEnd),
				hoverMessage
			});
		}
	}

	return decorations;
}

function debugLogRanges(editor: vscode.TextEditor, ranges: TextRange[]) {
	console.log('[dimloglines] update', {
		fileName: editor.document.fileName,
		languageId: editor.document.languageId,
		detectionMode: currentConfig.detectionMode,
		scanMode: currentConfig.scanMode,
		maxMatches: currentConfig.maxMatches,
		opacity: currentConfig.opacity,
		loggerNames: currentConfig.builtinDetector.loggerNames,
		logMethods: currentConfig.builtinDetector.logMethods,
		methodSuffixes: currentConfig.builtinDetector.methodSuffixes,
		matches: ranges.length
	});
	console.log('[dimloglines] config json', JSON.stringify(currentConfig));

	const text = editor.document.getText();
	for (const range of ranges) {
		const start = editor.document.positionAt(range.start);
		const end = editor.document.positionAt(range.end);
		const snippet = text.slice(range.start, range.end).replace(/\s+/g, ' ').trim();
		console.log(`[dimloglines] match ${start.line + 1}:${start.character + 1}-${end.line + 1}:${end.character + 1}`, snippet);
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log('dimloglines is now active');

	let timeout: ReturnType<typeof setTimeout> | undefined = undefined;
	let activeEditor = vscode.window.activeTextEditor;

	refreshConfig();

	function updateDecorations() {
		if (!activeEditor || !dimDecoration) {
			return;
		}

		if (!dimLogLines) {
			clearDecorations(activeEditor);
			return;
		}

		if (currentConfig.scanMode === 'document' && isDocumentTooLarge(activeEditor.document, currentConfig.maxFileSizeKb)) {
			clearDecorations(activeEditor);
			reportLargeDocument(activeEditor.document);
			return;
		}

		const ranges = findLogRanges(activeEditor);
		debugLogRanges(activeEditor, ranges);
		activeEditor.setDecorations(dimDecoration, createDecorationOptions(activeEditor, ranges));
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

	vscode.window.onDidChangeTextEditorVisibleRanges(event => {
		if (activeEditor && event.textEditor === activeEditor) {
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	vscode.workspace.onDidChangeConfiguration(event => {
		if (event.affectsConfiguration('dimloglines')) {
			refreshConfig();
			triggerUpdateDecorations();
		}
	}, null, context.subscriptions);

	const dimDisposable = vscode.commands.registerCommand('dimloglines.dim', () => {
		dimLogLines = true;
		triggerUpdateDecorations();
		vscode.window.showInformationMessage('activate dim log lines');
	});

	context.subscriptions.push(dimDisposable);

	const undimDisposable = vscode.commands.registerCommand('dimloglines.undim', () => {
		dimLogLines = false;
		triggerUpdateDecorations();
		vscode.window.showInformationMessage('deactivate dim log lines');
	});
	context.subscriptions.push(undimDisposable);

	context.subscriptions.push({
		dispose: () => {
			if (timeout) {
				clearTimeout(timeout);
			}
			if (dimDecoration) {
				dimDecoration.dispose();
				dimDecoration = undefined;
			}
		}
	});
}

export function deactivate() {
	console.log('dimloglines is now deactive!');
}
