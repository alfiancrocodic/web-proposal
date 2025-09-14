import '@testing-library/jest-dom';

// Mock Next.js Web APIs
Object.defineProperty(global, 'Request', {
  value: class Request {
    constructor(url, options = {}) {
      Object.defineProperty(this, 'url', {
        value: url,
        writable: false,
        enumerable: true,
        configurable: true
      });
      this.method = options.method || 'GET';
      this.headers = new Headers(options.headers || {});
      this._body = options.body;
    }
    
    async json() {
      try {
        return this._body ? JSON.parse(this._body) : {};
      } catch (error) {
        throw new SyntaxError('Unexpected token in JSON');
      }
    }
    
    async text() {
      return this._body || '';
    }
  },
  writable: true
});

// Mock NextResponse
jest.mock('next/server', () => ({
  NextRequest: class NextRequest extends global.Request {
    constructor(url, options = {}) {
      super(url, options);
    }
  },
  NextResponse: {
    json: (data, options = {}) => ({
      status: options.status || 200,
      json: () => Promise.resolve(data),
      headers: new Headers(options.headers || {})
    })
  }
}));

Object.defineProperty(global, 'Response', {
  value: class Response {
    constructor(body, options = {}) {
      this.status = options.status || 200;
      this._body = body;
    }
    
    static json(data, options = {}) {
      return new Response(JSON.stringify(data), {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
    }
    
    async json() {
      return this._body ? JSON.parse(this._body) : {};
    }
    
    async text() {
      return this._body || '';
    }
  },
  writable: true
});

// Mock Headers
Object.defineProperty(global, 'Headers', {
  value: class Headers extends Map {
    constructor(init) {
      super();
      if (init) {
        if (Array.isArray(init)) {
          init.forEach(([key, value]) => this.set(key, value));
        } else if (typeof init === 'object') {
          Object.entries(init).forEach(([key, value]) => this.set(key, value));
        }
      }
    }
    
    get(name) {
      return super.get(name.toLowerCase());
    }
    
    set(name, value) {
      return super.set(name.toLowerCase(), value);
    }
    
    has(name) {
      return super.has(name.toLowerCase());
    }
    
    delete(name) {
      return super.delete(name.toLowerCase());
    }
  },
  writable: true
});

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter() {
    return {
      push: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn()
    };
  },
  useParams() {
    return {};
  },
  useSearchParams() {
    return new URLSearchParams();
  },
  usePathname() {
    return '';
  }
}));

// Mock Next.js Image component
jest.mock('next/image', () => ({
  __esModule: true,
  default: (props) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={props.alt} />;
  }
}));

// Mock environment variables
process.env.NEXT_PUBLIC_API_URL = 'http://localhost:8000';

// Global test utilities
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});