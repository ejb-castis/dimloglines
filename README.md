# dimloglines

로그 라인을 색깔을 흐리게 만들어 줍니다.
정규식으로 로그 라인을 설정합니다.

## Features

* 로그 라인 글자의 흐린 정도를 설정합니다.
* 정규식으로 로그 라인 형태를 설정합니다.
	* 두 개의 기본 정규식 값을 사용하여 다음과 같은 로그 라인 형태를 설정합니다.
    * CPP, JAVA, JAVASCRIPT 와 같이 세미콜론(;) 으로 끝나는 로그 라인 형태를 지원합니다.
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

    * "xxlogxx.info(...)" 로 시작하여 ";"(세미콜론)으로 끝나는 문장
    ```cpp
    logger.Write(string("mainThread"), string(""), CiLogEvent::eDebug, string("test"));

    theLogger.info(WHERE1(m_channelID), "mpeg2ts SegmentType : %s", g_cfg->GetMpeg2tsSegmentType().c_str());

    logger.info("hello,world");
    ```

## Requirements

vscode 1.46 에서 개발되었습니다.

## Extension Settings

* `dimloglines.opacity`: 로그 라인 글자 색깔의 흐린 정도 값으로 0과 1사이의 값을 설정합니다.
	* default value : 0.2
* `dimloglines.regExps`: 로그 라인을 정규식으로 설정합니다.
	* default values :
		* "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
		* "\\w*[lL]og.*?\\.(Write|assert|debug|warning|info|information|report|success|error|fail|exception)\\s*\\(([\\s\\S]*?)\\)?\\s*?;"

``` javascript
"dimloglines.opacity": 0.5,
"dimloglines.regExps": [
	"\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;",
	"\\w*[lL]og.*?\\.(Write|assert|debug|warning|info|information|report|success|error|fail|exception)\\s*\\(([\\s\\S]*?)\\)?\\s*?;"
 ]
```

## Known Issues


## Release Notes

### 0.0.1

Initial release
