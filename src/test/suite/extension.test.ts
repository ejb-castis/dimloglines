import * as assert from 'assert';

import * as vscode from 'vscode';
import { compileRegExps, findBuiltinLogRanges, findLogRangesInText, mergeTextRanges, normalizeBuiltinDetectorConfig, normalizeDetectionMode, normalizeOpacity, normalizePositiveInteger, normalizeScanMode } from '../../extension';

const builtinConfig = normalizeBuiltinDetectorConfig({
	loggerNames: ['console', 'logger', 'log', 'LOGGER', 'clog'],
	logMethods: ['trace', 'debug', 'info', 'information', 'warn', 'warning', 'error', 'fail', 'exception', 'critical', 'fatal', 'panic', 'log', 'print', 'write', 'assert', 'report', 'success'],
	methodSuffixes: ['', 'f', 'ln', 'fln', 'f1'],
	logFunctions: ['LOG', 'CILOG', 'DASHLOG'],
	caseInsensitiveMethods: true
});

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('normalizes opacity to the supported range', () => {
		assert.equal(normalizeOpacity(0.5), 0.5);
		assert.equal(normalizeOpacity(-1), 0);
		assert.equal(normalizeOpacity(2), 1);
		assert.equal(normalizeOpacity(Number.NaN), 0.2);
	});

	test('normalizes positive integer settings', () => {
		assert.equal(normalizePositiveInteger(5.8, 10), 5);
		assert.equal(normalizePositiveInteger(0, 10), 10);
		assert.equal(normalizePositiveInteger(Number.NaN, 10), 10);
	});

	test('normalizes detection mode', () => {
		assert.equal(normalizeDetectionMode('builtin'), 'builtin');
		assert.equal(normalizeDetectionMode('regex'), 'regex');
		assert.equal(normalizeDetectionMode('both'), 'both');
		assert.equal(normalizeDetectionMode('unknown'), 'builtin');
	});

	test('normalizes scan mode', () => {
		assert.equal(normalizeScanMode('visible'), 'visible');
		assert.equal(normalizeScanMode('document'), 'document');
		assert.equal(normalizeScanMode('unknown'), 'visible');
	});

	test('compiles valid regex patterns and reports invalid patterns', () => {
		const compiled = compileRegExps(['log\\..*', '[']);

		assert.equal(compiled.regExps.length, 1);
		assert.equal(compiled.invalidPatterns.length, 1);
		assert.equal(compiled.invalidPatterns[0], '[');
	});

	test('merges duplicate, contained, and overlapping ranges', () => {
		const ranges = mergeTextRanges([
			{ start: 20, end: 30 },
			{ start: 10, end: 20 },
			{ start: 10, end: 20 },
			{ start: 12, end: 18 },
			{ start: 25, end: 40 },
			{ start: 50, end: 55 }
		], 10);

		assert.deepEqual(ranges, [
			{ start: 10, end: 40 },
			{ start: 50, end: 55 }
		]);
	});

	test('drops invalid ranges and respects max match limit after merge', () => {
		const ranges = mergeTextRanges([
			{ start: 0, end: 0 },
			{ start: 5, end: 4 },
			{ start: 1, end: 2 },
			{ start: 4, end: 5 },
			{ start: 8, end: 9 }
		], 2);

		assert.deepEqual(ranges, [
			{ start: 1, end: 2 },
			{ start: 4, end: 5 }
		]);
	});

	test('finds configured log functions', () => {
		const text = 'int value = 1;\nCILOG(info,\n  "created %d", value);\nreturn value;';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'CILOG(info,\n  "created %d", value);');
	});

	test('extends C++ stream-style macro log calls to the semicolon', () => {
		const text = 'LOG(error) << "failed: " << code;\nreturn code;';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'LOG(error) << "failed: " << code;');
	});

	test('finds a logger call that follows a multiline macro on the same line', () => {
		const text = [
			'DASHLOG(log_module(), debug,',
			'\t"segment created, code[%d]",',
			'\tcode); log.info("cpp log info");'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'DASHLOG(log_module(), debug,\n\t"segment created, code[%d]",\n\tcode);',
			'log.info("cpp log info");'
		]);
	});

	test('finds configured logger method calls', () => {
		const text = 'const value = 1;\nconsole.log("value", value);\nlogger.error("failed");';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 2);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'console.log("value", value);');
		assert.equal(text.slice(ranges[1].start, ranges[1].end), 'logger.error("failed");');
	});

	test('matches logger names case-insensitively when case-insensitive methods are enabled', () => {
		const config = {
			...builtinConfig,
			loggerNames: ['logger']
		};
		const text = 'logger.info("lowercase");\nLOGGER.debug("uppercase");';
		const ranges = findBuiltinLogRanges(text, config, 10);

		assert.equal(ranges.length, 2);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("lowercase");');
		assert.equal(text.slice(ranges[1].start, ranges[1].end), 'LOGGER.debug("uppercase");');
	});

	test('does not match uppercase logger names when case-insensitive matching is disabled', () => {
		const config = {
			...builtinConfig,
			loggerNames: ['logger'],
			caseInsensitiveMethods: false
		};
		const text = 'logger.info("lowercase");\nLOGGER.debug("uppercase");';
		const ranges = findBuiltinLogRanges(text, config, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("lowercase");');
	});

	test('finds logger method calls in the C++ sample shape', () => {
		const text = [
			'CILOG(info,',
			'\t"created item, code[%d]",',
			'\tcode);',
			'LOG(error) << "failed to create item, code=" << code;',
			'log.Printf("started");',
			'log.info("cpp log info");',
			'clog.info("cpp clog info");',
			'log.debug("cpp logger debug");',
			'logger.info("cpp logger info");',
			'LOGGER.debug("cpp uppercase logger debug");'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'CILOG(info,\n\t"created item, code[%d]",\n\tcode);',
			'LOG(error) << "failed to create item, code=" << code;',
			'log.Printf("started");',
			'log.info("cpp log info");',
			'clog.info("cpp clog info");',
			'log.debug("cpp logger debug");',
			'logger.info("cpp logger info");',
			'LOGGER.debug("cpp uppercase logger debug");'
		]);
	});

	test('finds JavaScript console calls', () => {
		const text = [
			'const value = { id: 1 };',
			'console.log("created", value);',
			'console.warn("slow path", value.id);',
			'console.error(new Error("failed"));'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 3);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'console.log("created", value);');
		assert.equal(text.slice(ranges[1].start, ranges[1].end), 'console.warn("slow path", value.id);');
		assert.equal(text.slice(ranges[2].start, ranges[2].end), 'console.error(new Error("failed"));');
	});

	test('finds multiline JavaScript logger calls with nested calls', () => {
		const text = [
			'logger.debug(',
			'  "payload",',
			'  JSON.stringify({ id: user.id, name: getName(user) })',
			');',
			'return user;'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), [
			'logger.debug(',
			'  "payload",',
			'  JSON.stringify({ id: user.id, name: getName(user) })',
			');'
		].join('\n'));
	});

	test('finds JavaScript optional semicolon calls', () => {
		const text = 'logger.info("without semicolon")\nconst next = 1';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("without semicolon")');
	});

	test('ignores JavaScript property names that only contain logger names', () => {
		const text = 'catalog.logger.info("not a direct configured logger");\nmylogger.info("not configured");\nlogger.info("real");';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("real");');
	});

	test('finds Java logger calls', () => {
		const text = [
			'logger.info("start {}", id);',
			'LOGGER.warn("retry {}", count);',
			'log.error("failed", ex);'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 3);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("start {}", id);');
		assert.equal(text.slice(ranges[1].start, ranges[1].end), 'LOGGER.warn("retry {}", count);');
		assert.equal(text.slice(ranges[2].start, ranges[2].end), 'log.error("failed", ex);');
	});

	test('finds case-insensitive methods and configured suffixes', () => {
		const text = 'log.Println("hello")\nclog.Errorf("failed: %v", err)\nclog.Debugf1(reqID, "message")';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 3);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'log.Println("hello")');
		assert.equal(text.slice(ranges[1].start, ranges[1].end), 'clog.Errorf("failed: %v", err)');
		assert.equal(text.slice(ranges[2].start, ranges[2].end), 'clog.Debugf1(reqID, "message")');
	});

	test('preserves the empty method suffix from extension defaults', () => {
		const text = [
			'log.Printf("started");',
			'log.info("cpp log info");',
			'clog.info("cpp clog info");',
			'log.debug("cpp logger debug");'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'log.Printf("started");',
			'log.info("cpp log info");',
			'clog.info("cpp clog info");',
			'log.debug("cpp logger debug");'
		]);
	});

	test('finds adjacent Go Printf and Fatal logger calls', () => {
		const text = [
			'log.Printf("request id=%s", reqID)',
			'log.Fatal("fatal error")'
		].join('\n');
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'log.Printf("request id=%s", reqID)',
			'log.Fatal("fatal error")'
		]);
	});

	test('respects max match limit', () => {
		const text = 'LOG(info);\nLOG(error);\nLOG(debug);';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 2);

		assert.equal(ranges.length, 2);
	});

	test('ignores logger calls inside comments and strings', () => {
		const text = '// logger.info("comment");\n# logger.error("hash comment")\nconst text = "LOG(error);";\nlogger.info("real");';
		const ranges = findBuiltinLogRanges(text, builtinConfig, 10);

		assert.equal(ranges.length, 1);
		assert.equal(text.slice(ranges[0].start, ranges[0].end), 'logger.info("real");');
	});

	test('merges built-in and regex ranges for both detection mode behavior', () => {
		const text = 'logger.info("hello");\nCUSTOM_LOG("world");';
		const ranges = findLogRangesInText(text, builtinConfig, [
			/logger\.info\([\s\S]*?\);/gm,
			/CUSTOM_LOG\([\s\S]*?\);/gm
		], 'both', 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'logger.info("hello");',
			'CUSTOM_LOG("world");'
		]);
	});

	test('supports regex-only detection mode', () => {
		const text = 'logger.info("builtin only");\nCUSTOM_LOG("regex only");';
		const ranges = findLogRangesInText(text, builtinConfig, [
			/CUSTOM_LOG\([\s\S]*?\);/gm
		], 'regex', 10);

		assert.deepEqual(ranges.map(range => text.slice(range.start, range.end)), [
			'CUSTOM_LOG("regex only");'
		]);
	});
});
