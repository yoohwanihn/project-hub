import pino from 'pino';

const logger = pino({
  level: process.env.LOG_LEVEL ?? 'info',
  timestamp: pino.stdTimeFunctions.isoTime,
  formatters: {
    level(label) { return { level: label }; },
    bindings()   { return {}; },              // pid/hostname 제거
  },
  redact: {
    paths: [
      'password', 'password_hash', 'currentPassword', 'newPassword',
      'token', 'accessToken', 'refreshToken',
      'req.headers.authorization',
      'data',   // base64 첨부파일 필드
    ],
    censor: '[REDACTED]',
  },
  serializers: {
    err: pino.stdSerializers.err,
  },
});

export default logger;
