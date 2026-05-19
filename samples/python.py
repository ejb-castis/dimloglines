import logging

logger = logging.getLogger(__name__)


def run():
    logger.info("python logger object is covered by the default built-in scanner")
    logging.warning("use detectionMode=regex or customize loggerNames/logMethods for this")

    # logger.info("comment only")
    text = 'logger.error("string only")'
    return text
