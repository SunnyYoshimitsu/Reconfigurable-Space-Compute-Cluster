declare global {
  interface Window {
    env: {
      WS_URL: string;
      // add other env variables here as needed
    };
  }
}

export {};
