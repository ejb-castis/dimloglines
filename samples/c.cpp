#include <string>

int main() {
	int code = 42;

	CILOG(info,
		"created item, code[%d]",
		code);

	DASHLOG(log_module(), debug,
		"segment created, code[%d]",
		code);

	DASHLOG(log_module(), debug,
		"segment created on same line, code[%d]",
		code); 
	log.info("cpp log info after macro");

	LOG(error) << "failed to create item, code=" << code;

	log.Printf("started");
	log.info("cpp log info");
	clog.info("cpp clog info");
	log.debug("cpp logger debug");
	logger.info("cpp logger info");
	LOGGER.debug("cpp uppercase logger debug");

	// The next two lines should not be dimmed by the built-in scanner.
	// logger.info("comment only");
	std::string text = "LOG(error);";

	return code;
}
