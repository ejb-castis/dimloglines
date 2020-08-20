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

* Set regular expression to specify the log line format
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

## Extension Settings

* `dimloglines.opacity`: opacity for the color of log lines, between 0 and 1
  * default value : 0.2
* `dimloglines.regExps`: regular expressions for the log line format
  * default values :
    * "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL]og.*?\\.(Debug|Report|Info|Success|Warning|Error|Fail|Exception|Critical|Fatal|Fatalln|Panic|Panicln|Print|Println)\\w*\\s*\\([\\s\\S]*?\\)[\\t ]*$"

* default values in VSCODE:
``` javascript
"dimloglines.opacity": 0.2,
"dimloglines.regExps": [
  "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL]og.*?\\.(Debug|Report|Info|Success|Warning|Error|Fail|Exception|Critical|Fatal|Fatalln|Panic|Panicln|Print|Println)\\w*\\s*\\([\\s\\S]*?\\)[\\t ]*$"
 ]
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
