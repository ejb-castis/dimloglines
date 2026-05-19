const user = { id: 7, name: 'Ada' };

console.log('created user', user);
console.warn('slow path', user.id);
console.error(new Error('failed to save user'));

logger.debug(
	'payload',
	JSON.stringify({ id: user.id, name: user.name })
);

logger.info('without semicolon')

// The next lines should not be dimmed by the built-in scanner.
// logger.info('comment only');
const text = 'console.log("string only")';
catalog.logger.info('nested property, not a direct configured logger');
mylogger.info('logger name is not configured');

export function run() {
	return user.id;
}
