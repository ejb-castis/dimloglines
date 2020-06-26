# dimloglines

로그 라인 글자 색깔을 흐리게 만들어 줍니다.

## Features
* 실행 방법
  * ctrl + shift + p 를 누르고 dim log lines 또는 undim log lines 실행합니다.
    * dim log lines : 활성화 하기
    * undim log lines : 비활성화 하기
* 로그 라인 글자 색깔의 흐린 정도를 설정합니다. (설정 값은 Extension.Setting를 참고하세요)
* 정규식으로 로그 라인 형태를 설정합니다. (정규식은 아래 Extension.Setting를 참고하세요)
	* 기본 정규식 값으로 다음과 같은 로그 라인 형태를 설정합니다.
    * "xxLOG(...)" 로 시작하여 ";"(세미콜론)으로 끝나는 문장
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
    * "xxlogxx.info|debug|등등(...)" 로 시작하여 ";"(세미콜론)으로 끝나는 문장
    ```cpp
    logger.Write(string("mainThread"), string(""), CiLogEvent::eDebug, string("test"));

    theLogger.info(WHERE1(m_channelID), "mpeg2ts SegmentType : %s", g_cfg->GetMpeg2tsSegmentType().c_str());

    logger.info("hello,world");

    LOGGER.debug("hello,{}",world);
    ```
    * "xxlogxx.Info|Debug|등등(..." 로 시작하여 ")"(괄호)으로 끝나는 문장

    ```go
      clog.Debugf("[%s] origin check success.", a.addr)

      log.Fatal("fatal error")

      log.Println("hello, World!!!")
    ```

## Requirements

vscode 1.46 에서 개발되었습니다.

## Extension Settings

* `dimloglines.opacity`: 로그 라인 글자 색깔의 흐린 정도 값으로 0과 1사이의 값을 설정합니다.
  * default value : 0.2
* `dimloglines.regExps`: 로그 라인을 정규식으로 설정합니다.
  * default values :
    * "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
    * "\\w*[lL]og.*?\\.(Debugf?|Reportf?|Infof?|Successf?|Warningf?|Errorf?|Failf?|Exceptionf?|Criticalf?|Fatalf?|Fatalln|Panicf?|Panicln|Printf?|Println)\\s*\\([\\s\\S]*?\\)"

``` javascript
"dimloglines.opacity": 0.2,
"dimloglines.regExps": [
  "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL][oO][gG].*?\\.(Write|assert|debug|report|info|information|success|warning|error|fail|exception|critical)\\s*\\([\\s\\S]*?\\)?\\s*?;"
  ,"\\w*[lL]og.*?\\.(Debugf?|Reportf?|Infof?|Successf?|Warningf?|Errorf?|Failf?|Exceptionf?|Criticalf?|Fatalf?|Fatalln|Panicf?|Panicln|Printf?|Println)\\s*\\([\\s\\S]*?\\)"
 ]
```

## Known Issues


## Release Notes

### 0.0.1

Initial release
