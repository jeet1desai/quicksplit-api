import dotenv from 'dotenv';
import bunyan from 'bunyan';

dotenv.config({});

class Config {
  public NODE_ENV: string | undefined;
  public PORT: string | undefined;

  public DATABASE_URL: string | undefined;

  public SECRET_KEY_ONE: string | undefined;
  public SECRET_KEY_TWO: string | undefined;

  public API_MONITORING_USERNAME: string | undefined;
  public API_MONITORING_PASSWORD: string | undefined;

  public RATE_LIMIT_WINDOW_MS: number | undefined;
  public RATE_LIMIT_MAX_REQ: number | undefined;

  public JWT_SECRET: string | undefined;

  public COOKIE_SECURE: string | undefined;
  public COOKIE_DOMAIN: string | undefined;

  private readonly DEFAULT_NODE_ENV = 'development';
  private readonly DEFAULT_PORT = '3000';

  private readonly DEFAULT_DATABASE_URL = 'mongodb://127.0.0.1:27017/quicksplit';

  private readonly DEFAULT_SECRET_KEY_ONE = '1234567890abcdefghijklmnopqrstuvwxyz';
  private readonly DEFAULT_SECRET_KEY_TWO = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  private readonly DEFAULT_API_MONITORING_USERNAME = '1234567890abcdefghijklmnopqrstuvwxyz';
  private readonly DEFAULT_API_MONITORING_PASSWORD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  private readonly DEFAULT_RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
  private readonly DEFAULT_RATE_LIMIT_MAX_REQ = 100;

  private readonly DEFAULT_JWT_SECRET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

  private readonly DEFAULT_COOKIE_SECURE = 'false';
  private readonly DEFAULT_COOKIE_DOMAIN = 'localhost';

  public GOOGLE_GEMINI_API_KEY: string | undefined;
  public GEMINI_MODEL: string | undefined;

  public META_ACCESS_TOKEN: string | undefined;
  public META_VERIFY_TOKEN: string | undefined;
  public WHATSAPP_API_VERSION: string | undefined;
  public META_PHONE_NUMBER_ID: string | undefined;
  public META_WEBHOOK_URL: string | undefined;

  public WEB_BASE_URL: string | undefined;

  private readonly DEFAULT_META_ACCESS_TOKEN =
    'EAAS5m971FCkBPpzFj7cI5OgkYcZBZBdIlcGskbHNu6cUSSVON5o7ZB22EEDRjZAAC40dTCWYx4KwzudXQUGRUbTOlo1F2bZA1H1t5tYiVV3w15CKfZCU2vTVQIsOpnZCkv4vuKYWjgBgZCFxTRTHPV5SiK1Cfx97gfIYnBZAZCCKY28Ml1nEyLhPqb4D1M8GgZBZCAbiZCY0h6OGG3pJwdwTnNZCJbjHL9wd8td01bUDwgOzyzrosZD';
  private readonly DEFAULT_META_VERIFY_TOKEN = '6525834d-fc94-4858-bbde-71fda692f0d4';
  private readonly DEFAULT_WHATSAPP_API_VERSION = 'v19.0';
  private readonly DEFAULT_META_PHONE_NUMBER_ID = '802871279581464';
  private readonly DEFAULT_META_WEBHOOK_URL = 'https://localhost:3000/whatsapp/webhook';

  private readonly DEFAULT_GOOGLE_GEMINI_API_KEY = 'AIzaSyCZ1WoJhtmY9ZJz7QjG4bYIu4Df2jgVBTY';
  private readonly DEFAULT_GEMINI_MODEL = 'gemini-2.0-flash';

  private readonly DEFAULT_WEB_BASE_URL = 'http://localhost:5173';

  constructor() {
    this.NODE_ENV = process.env.NODE_ENV || this.DEFAULT_NODE_ENV;
    this.PORT = process.env.PORT || this.DEFAULT_PORT;

    this.DATABASE_URL = process.env.DATABASE_URL || this.DEFAULT_DATABASE_URL;

    this.SECRET_KEY_ONE = process.env.SECRET_KEY_ONE || this.DEFAULT_SECRET_KEY_ONE;
    this.SECRET_KEY_TWO = process.env.SECRET_KEY_TWO || this.DEFAULT_SECRET_KEY_TWO;

    this.API_MONITORING_USERNAME = process.env.API_MONITORING_USERNAME || this.DEFAULT_API_MONITORING_USERNAME;
    this.API_MONITORING_PASSWORD = process.env.API_MONITORING_PASSWORD || this.DEFAULT_API_MONITORING_PASSWORD;

    this.RATE_LIMIT_WINDOW_MS = process.env.RATE_LIMIT_WINDOW_MS ? Number(process.env.RATE_LIMIT_WINDOW_MS) : this.DEFAULT_RATE_LIMIT_WINDOW_MS;
    this.RATE_LIMIT_MAX_REQ = process.env.RATE_LIMIT_MAX_REQ ? Number(process.env.RATE_LIMIT_MAX_REQ) : this.DEFAULT_RATE_LIMIT_MAX_REQ;

    this.JWT_SECRET = process.env.JWT_SECRET || this.DEFAULT_JWT_SECRET;

    this.META_ACCESS_TOKEN = process.env.META_ACCESS_TOKEN || this.DEFAULT_META_ACCESS_TOKEN;
    this.META_VERIFY_TOKEN = process.env.META_VERIFY_TOKEN || this.DEFAULT_META_VERIFY_TOKEN;
    this.WHATSAPP_API_VERSION = this.DEFAULT_WHATSAPP_API_VERSION;
    this.META_PHONE_NUMBER_ID = process.env.META_PHONE_NUMBER_ID || this.DEFAULT_META_PHONE_NUMBER_ID;
    this.META_WEBHOOK_URL = process.env.META_WEBHOOK_URL || this.DEFAULT_META_WEBHOOK_URL;

    this.COOKIE_SECURE = process.env.COOKIE_SECURE || this.DEFAULT_COOKIE_SECURE;
    this.COOKIE_DOMAIN = process.env.COOKIE_DOMAIN || this.DEFAULT_COOKIE_DOMAIN;

    this.GOOGLE_GEMINI_API_KEY = process.env.GOOGLE_GEMINI_API_KEY || this.DEFAULT_GOOGLE_GEMINI_API_KEY;
    this.GEMINI_MODEL = process.env.GEMINI_MODEL || this.DEFAULT_GEMINI_MODEL;

    this.WEB_BASE_URL = process.env.WEB_BASE_URL || this.DEFAULT_WEB_BASE_URL;
  }

  public createLogger(name: string): bunyan {
    return bunyan.createLogger({
      name,
      level: this.NODE_ENV === 'development' ? 'debug' : 'info'
    });
  }

  public validateConfig(): void {
    for (const [key, value] of Object.entries(this)) {
      if (value === undefined) {
        throw new Error(`Missing environment variable: ${key}`);
      }
    }
  }
}

export const config: Config = new Config();
