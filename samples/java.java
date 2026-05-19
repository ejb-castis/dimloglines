class Sample {
	private static final Logger logger = Logger.getLogger(Sample.class.getName());
	private static final Logger LOGGER = Logger.getLogger("sample");
	private static final Logger log = Logger.getLogger("short");

	void run(String id, Exception ex) {
		logger.info("start " + id);
		LOGGER.warn("retry " + id);
		log.error("failed", ex);

		logger.debug(
			"payload " + id
		);

		// The next two lines should not be dimmed by the built-in scanner.
		// logger.info("comment only");
		String text = "logger.error(\"string only\")";
	}
}

class Logger {
	static Logger getLogger(Object name) {
		return new Logger();
	}

	void info(String message) {}
	void warn(String message) {}
	void error(String message, Exception ex) {}
	void debug(String message) {}
}
