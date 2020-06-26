# dimloglines

dim log lines in the text file

## Features

set the opacity of displaying specified log lines in the editor
specify log lines with the regular expression

## Requirements

vscode 1.46

## Extension Settings

This extension contributes the following settings:

* `dimloglines.opacity`: value between 0 and 1 used for the opacity for the dimmed log lines
* `dimloglines.regExps`: regular expressions to identify log line
	* default regular expressions:
		* "\\w*LOG\\s*\\([\\s\\S]*?\\)?\\s*?;"
		* "\\w*[lL]og.*?\\.(Write|assert|debug|warning|info|information|report|success|error|fail|exception)\\s*\\(([\\s\\S]*?)\\)?\\s*?;"


## Known Issues



## Release Notes

### 0.0.1

Initial release
