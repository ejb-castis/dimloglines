# DimLogLines 

Dim the color of the log lines in the code

## Features

* Activate or Deactivate
  * Activate : dim log lines
    * Press ctrl + shift + p, excute "dim log lines"
  * Deactivate : undim log lines
    * Press ctrl + shift + p, excute "undim log lines"

* Set the opacity of the color
    * Refer to Extension Settings below

* Set logger names, logger methods, and log function names to specify the log line format
    * Refer to Extension Settings below

* Use regular expressions as a fallback for custom log formats
    * Refer to Extension Settings below

* Default settings specify the following formats
    * Starts with "xxLOG(...)", ends with  ";"

    ```cpp
      CILOG(info,
        "[{}] pid[{}], success to find avc sync word, skip_total[{}]",
        id_, pid_, skip_total_);

      DASHLOG(log_module(), debug,
              "[{}] track[{}], success to make segment, type[{}], pts[{},{}], "
              "dur[{},{}], sample-cnt[{}], size[{}], llsegno[{}]",
              id_, m->id_, type, std::uint64_t(si->pts_), pts_ms, si->duration_,
              dur, sample_cnt, seg_size, si->no_);

      LOG(error) << "hello";
    ```

    * Starts with "xxlogxx.info|debug|...", ends with  ";"

    ```cpp
    logger.Write(string("mainThread"), string(""), CiLogEvent::eDebug, string("test"));

    theLogger.info(WHERE1(m_channelID), "mpeg2ts SegmentType : %s", g_cfg->GetMpeg2tsSegmentType().c_str());

    logger.info("hello,world :)");

    LOGGER.debug("hello,{}",world);
    ```

    * Starts with "xxlogxx.Info|Debug|...", ends with  ")"

    ```go
      clog.Debugf("[%s] origin check success.", a.addr)

      log.Fatal("fatal error")

      log.Println("hello, World!!! :)")

      log.Fatalf("can not enable coredump, error(%s)", err.Error())

      clog.Infof1(vfile.ReqID(), "big contents without supporting Range header => bypass")

      clog.Errorf1("failed to handle message, %s, %v", noti.hashKey, string(noti.message), err)
      clog.Errorf1(reqID, "%v", err)

      clog.Debugf1(reqID, "to origin, %s %s %v timeout:%v", req.Method, req.URL, req.Header, timeout)
    ```

## Requirements

Built with VSCODE 1.46

## Security

If you find a security issue, please do not open a public issue first.

1. Report privately to the maintainer.
2. Include reproduction steps, affected versions, and impact.
3. Acknowledge and triage quickly, then release a fix and publish notes.

For dependency-related findings, include the package name, vulnerable version range, and suggested patched version.

## Extension Settings

* `dimloglines.opacity`: opacity for the color of log lines, between 0 and 1
  * default value : 0.2
* `dimloglines.detectionMode`: log detection strategy
  * values : `builtin`, `regex`, `both`
  * default value : `builtin`
* `dimloglines.scanMode`: scan only the visible editor window or the full document
  * values : `visible`, `document`
  * default value : `visible`
* `dimloglines.visibleContextLines`: number of lines before and after the visible editor range to include when `scanMode` is `visible`
  * default value : 20
* `dimloglines.loggerNames`: logger object names used by the built-in scanner
  * default values : `console`, `logger`, `log`, `LOGGER`, `clog`
* `dimloglines.logMethods`: logger method names used by the built-in scanner
  * default values : `trace`, `debug`, `info`, `information`, `warn`, `warning`, `error`, `fail`, `exception`, `critical`, `fatal`, `panic`, `log`, `print`, `write`, `assert`, `report`, `success`
* `dimloglines.methodSuffixes`: method suffixes accepted by the built-in scanner
  * default values : empty string, `f`, `ln`, `fln`, `f1`
* `dimloglines.logFunctions`: function or macro names used by the built-in scanner
  * default values : `LOG`, `CILOG`, `DASHLOG`
* `dimloglines.caseInsensitiveMethods`: match logger methods case-insensitively in the built-in scanner
  * default value : true
* `dimloglines.regExps`: fallback regular expressions for the log line format
  * default values :
    * "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL]og.*?\\.(Debug|Report|Info|Success|Warning|Error|Fail|Exception|Critical|Fatal|Fatalln|Panic|Panicln|Print|Println)\\w*\\s*\\([\\s\\S]*?\\)[\\t ]*$"
* `dimloglines.maxFileSizeKb`: maximum document size in KB to scan
  * default value : 1024
* `dimloglines.maxMatches`: maximum number of matched ranges to decorate
  * default value : 5000

* default values in VSCODE:
``` javascript
"dimloglines.opacity": 0.2,
"dimloglines.detectionMode": "builtin",
"dimloglines.scanMode": "visible",
"dimloglines.visibleContextLines": 20,
"dimloglines.loggerNames": ["console", "logger", "log", "LOGGER", "clog"],
"dimloglines.logMethods": ["trace", "debug", "info", "information", "warn", "warning", "error", "fail", "exception", "critical", "fatal", "panic", "log", "print", "write", "assert", "report", "success"],
"dimloglines.methodSuffixes": ["", "f", "ln", "fln", "f1"],
"dimloglines.logFunctions": ["LOG", "CILOG", "DASHLOG"],
"dimloglines.caseInsensitiveMethods": true,
"dimloglines.regExps": [
  "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL]og.*?\\.(Debug|Report|Info|Success|Warning|Error|Fail|Exception|Critical|Fatal|Fatalln|Panic|Panicln|Print|Println)\\w*\\s*\\([\\s\\S]*?\\)[\\t ]*$"
 ],
"dimloglines.maxFileSizeKb": 1024,
"dimloglines.maxMatches": 5000
```

## Scan Behavior

By default, DimLogLines does not scan the full file. It scans the current visible editor range plus the configured context lines before and after it.

* `scanMode: "visible"`
  * scans the current visible editor range plus `visibleContextLines`
  * recalculates decorations when the editor scrolls or the visible range changes
  * keeps large files responsive because only the visible window is scanned
* `scanMode: "document"`
  * scans the full document
  * applies `maxFileSizeKb` as a full-document scan guard

`maxMatches` is still applied in both scan modes as a safety limit for the number of decorated ranges.

## Safe Regex Guidelines

This extension executes user-provided regular expressions from `dimloglines.regExps`.
Unsafe patterns can cause heavy backtracking and freeze the editor on large files.

Use these guidelines:

* Keep patterns simple and specific.
* Avoid ambiguous nested quantifiers such as `(.*)+`, `(.+)*`, `(a|aa)+`.
* Prefer explicit token sets and boundaries over broad wildcards.
* Keep the number of configured patterns as low as possible.
* Validate new patterns on small sample files before applying to very large files.

If you notice slowdowns after adding a pattern, remove the most recent regex first and test again.

## Dependency Update Policy

To reduce supply-chain risk, keep dependencies patched regularly.

Recommended routine:

1. Review Dependabot alerts weekly.
2. Apply security updates to vulnerable dependencies first.
3. Run checks before release.

Example commands:

```sh
npm audit
npm audit fix
npm outdated
npm test
```

## Known Issues


## References

* https://github.com/AndrewMorsillo/vscode-dimmer
* https://github.com/Microsoft/vscode-extension-samples

## Release Notes

### 0.0.3

- add multiline option in RegExp constructor
- update default regex

### 0.0.2

- upload icon

### 0.0.1

- Initial release
